import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import Chart from "../components/Chart";
import SimView from "../components/SimView";
import type { Analysis, ModelMeta, Params, Run, RunOut } from "../types";

const STEPS = ["Savol", "Gipoteza", "Reja", "Simulyatsiya", "Tahlil", "Keyingi tajriba"];
const defaults = (m: ModelMeta): Params => Object.fromEntries(m.params.map((p) => [p.key, p.default]));

export default function Architect() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [step, setStep] = useState(0);
  const [question, setQuestion] = useState("");
  const [meta, setMeta] = useState<ModelMeta | null>(null);
  const [alts, setAlts] = useState<ModelMeta[]>([]);
  const [unsupported, setUnsupported] = useState(false);
  const [hi, setHi] = useState(-1);
  const [note, setNote] = useState("");
  const [params, setParams] = useState<Params>({});
  const [out, setOut] = useState<RunOut | null>(null);
  const [curve, setCurve] = useState<[number, number][]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [fire, setFire] = useState(0);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const choose = (m: ModelMeta, q?: string) => {
    setMeta(m); setParams(defaults(m)); setRuns([]); setHi(-1); setSaved(false); setAnalysis(null);
    setQuestion(q ?? `${m.name}: ${m.description}`); setStep(1); setErr("");
  };

  useEffect(() => {
    const id = sp.get("model");
    if (id) api.models().then((ms) => { const m = ms.find((x) => x.id === id); if (m) choose(m); });
  }, [sp]);

  // parametr o'zgarsa — hisob backend'da bajariladi (AI emas)
  useEffect(() => {
    if (step !== 3 || !meta || !Object.keys(params).length) return;
    const t = setTimeout(() => {
      Promise.all([api.run(meta.id, params), api.sweep(meta.id, params)])
        .then(([o, s]) => { setOut(o); setCurve(s.points); setErr(""); })
        .catch((e) => setErr(e.message));
    }, 80);
    return () => clearTimeout(t);
  }, [step, meta, params]);

  useEffect(() => {
    if (step !== 4 || !meta) return;
    api.analyze(meta.id, hi, runs.map((r) => r.params)).then(setAnalysis).catch((e) => { setErr(e.message); setStep(3); });
  }, [step]);

  async function ask() {
    setErr("");
    try {
      const r = await api.plan(question);
      setAlts(r.alternatives);
      if (r.matched && r.model) choose(r.model, question); else setUnsupported(true);
    } catch (e) { setErr((e as Error).message); }
  }

  const record = () => {
    if (!out || !meta) return;
    setRuns([...runs, { params: { ...params }, y: out.y, traj: out.trajectory }]);
    if (out.trajectory) setFire(Date.now());
  };
  const tryAnalyze = () => (runs.length ? setStep(4) : setErr(meta!.need));
  const save = async () => {
    if (!meta) return;
    try {
      await api.save({ model_id: meta.id, question, hypothesis_index: hi, hypothesis_note: note, runs: runs.map((r) => r.params) });
      setSaved(true);
    } catch (e) { setErr((e as Error).message); }
  };
  const startNext = () => { setParams({ ...params, ...meta!.next_set }); setRuns([]); setSaved(false); setErr(""); setStep(3); };

  return (
    <div>
      <h1 className="text-2xl mb-3">AI Tajriba me'mori</h1>
      <div className="flex overflow-x-auto border-b border-line mb-4">
        {STEPS.map((s, i) => <div key={s} className={`px-3.5 py-2 whitespace-nowrap border-b-[3px] ${i === step ? "border-acc font-bold" : i < step ? "border-ok text-mute" : "border-transparent text-mute"}`}>{i + 1}. {s}</div>)}
      </div>
      {err && <div role="alert" className="note mb-3">{err}</div>}

      {step === 0 && (
        <div className="card grid gap-3">
          <h2 className="text-lg">Qaysi hodisani tekshirmoqchisiz?</h2>
          <p className="text-mute">Hozircha tasdiqlangan modellar: kvadrat funksiya, mayatnik va otilgan jism. Savolingiz modelga bog'lanadi; hisob-kitobni AI emas, backend'dagi model bajaradi.</p>
          <textarea className="input" rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Otish burchagi jismning uchish masofasiga qanday ta'sir qiladi?" />
          {unsupported && (
            <div className="note">Bu savol hozircha qo'llab-quvvatlanmaydi. Mavjud tajribalardan birini tanlang:
              <div className="flex gap-2 mt-2 flex-wrap">{alts.map((m) => <button key={m.id} className="btn btn-sec" onClick={() => choose(m)}>{m.name}</button>)}</div>
            </div>
          )}
          <div><button className="btn" disabled={question.trim().length < 3} onClick={ask}>Davom etish</button></div>
        </div>
      )}

      {step === 1 && meta && (
        <div className="card grid gap-2">
          <div><span className="chip">{meta.name}</span></div>
          <h2 className="text-lg">Tahminingizni tanlang: {meta.prompt}</h2>
          <p className="text-mute">Maslahat: {meta.hint}</p>
          {meta.hypotheses.map((h, i) => (
            <label key={i} className={`flex gap-2 border rounded-lg p-2.5 cursor-pointer ${hi === i ? "border-acc bg-[#0f1b1f]" : "border-line"}`}>
              <input type="radio" name="h" checked={hi === i} onChange={() => setHi(i)} />{h}
            </label>
          ))}
          <textarea className="input" rows={2} placeholder="Sababini yozing (ixtiyoriy)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-2"><button className="btn btn-sec" onClick={() => setStep(0)}>Orqaga</button><button className="btn" disabled={hi < 0} onClick={() => setStep(2)}>Davom etish</button></div>
        </div>
      )}

      {step === 2 && meta && (
        <div className="card grid gap-3">
          <h2 className="text-lg">Tajriba rejasi</h2>
          <table className="w-full"><tbody>{meta.plan.map(([a, b]) => <tr key={a} className="border-b border-line"><td className="py-2 text-mute w-2/5">{a}</td><td>{b}</td></tr>)}</tbody></table>
          <div><span className="inline-block font-head font-bold bg-[#0f1b1f] border border-line px-3 py-1.5 rounded-md">{meta.equation}</span></div>
          <div className="note">{meta.assumptions}</div>
          <div className="flex gap-2"><button className="btn btn-sec" onClick={() => setStep(1)}>Orqaga</button><button className="btn" onClick={() => setStep(3)}>Laboratoriyaga o'tish</button></div>
        </div>
      )}

      {step === 3 && meta && (
        <div className="grid gap-3 lg:grid-cols-[230px_1fr_290px]">
          <div className="card">
            <h3>Parametrlar</h3>
            {meta.params.map((p) => (
              <label key={p.key} className="block mt-3 font-medium">{p.label} ({p.unit})<output className="float-right text-acc font-bold">{params[p.key]}</output>
                <input type="range" className="w-full" min={p.min} max={p.max} step={p.step} value={params[p.key] ?? p.default} onChange={(e) => setParams({ ...params, [p.key]: +e.target.value })} />
              </label>
            ))}
            <div className="flex gap-2 mt-4 flex-wrap">
              <button className="btn" onClick={record}>{meta.id === "projectile_motion" ? "Otish" : "O'lchovni yozish"}</button>
              <button className="btn btn-sec" onClick={() => setRuns([])}>Tozalash</button>
            </div>
          </div>
          <div className="min-w-0 grid gap-3 content-start">
            <div className="rounded-xl border border-line bg-gradient-to-b from-[#0a2230] to-[#0a1a24]"><SimView meta={meta} params={params} out={out} runs={runs} fire={fire} /></div>
            <div className="card overflow-x-auto">
              <h3 className="mb-2">Ma'lumotlar jadvali</h3>
              {runs.length === 0 ? <span className="text-mute">Hali o'lchov yo'q</span> : (
                <table className="w-full text-left"><thead className="text-mute"><tr><th>#</th>{meta.params.map((p) => <th key={p.key}>{p.key}</th>)}<th>{meta.y_unit}</th></tr></thead>
                  <tbody>{runs.map((r, i) => <tr key={i} className="border-t border-line"><td>{i + 1}</td>{meta.params.map((p) => <td key={p.key}>{r.params[p.key]}</td>)}<td>{r.y.toFixed(2)}</td></tr>)}</tbody></table>
              )}
            </div>
          </div>
          <div className="card">
            <div className="text-mute">{meta.y_label}</div>
            <div className="font-head font-extrabold text-3xl text-acc">{out ? out.y.toFixed(2) : "…"} {meta.y_unit}</div>
            {out?.time !== undefined && <div className="text-mute">Vaqt {out.time.toFixed(2)} s · Balandlik {out.max_height?.toFixed(2)} m</div>}
            <div className="mt-2"><Chart meta={meta} curve={curve} runs={runs} current={out ? [params[meta.x_key], out.y] : undefined} /></div>
            <div className="note mt-2">{meta.assumptions}</div>
            <div className="mt-3"><button className="btn" onClick={tryAnalyze}>Natijalarni tahlil qilish</button></div>
          </div>
        </div>
      )}

      {step === 4 && meta && (
        <div className="card grid gap-3">
          <h2 className="text-lg">Natijalarni tahlil qilish</h2>
          {!analysis ? <p className="text-mute">Hisoblanmoqda…</p> : (<>
            <p><b>Sizning gipotezangiz:</b> {meta.hypotheses[hi]}{note && <><br /><span className="text-mute">“{note}”</span></>}</p>
            <p><b>{analysis.metric_label}:</b> <span className="font-head font-extrabold text-3xl text-acc">{analysis.metric_value}</span></p>
            <p><b>Ma'lumotlar ko'rsatdi:</b> {analysis.truth_text}</p>
            <div className={`border-l-[3px] ${analysis.matched ? "border-ok" : "border-warn"} bg-[#0f1b1f] rounded px-3 py-2`}>
              {analysis.matched ? "Gipotezangiz ma'lumotlarga mos keladi." : "Gipoteza ma'lumotlarga mos kelmadi. Bu xato emas, bu yangi bilim."}
            </div>
            <p>{analysis.why}</p>
            <Chart meta={meta} curve={curve} runs={runs} />
            <div className="flex gap-2"><button className="btn btn-sec" onClick={() => setStep(3)}>Orqaga</button><button className="btn" onClick={() => setStep(5)}>Keyingi tajriba</button></div>
          </>)}
        </div>
      )}

      {step === 5 && meta && (
        <div className="card grid gap-3">
          <h2 className="text-lg">Keyingi tajriba</h2><p>{meta.next_text}</p>
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-sec" onClick={() => setStep(4)}>Orqaga</button>
            <button className="btn" onClick={startNext}>Shu tajribani boshlash</button>
            <button className="btn btn-sec" disabled={saved} onClick={save}>{saved ? "Saqlandi" : "Tajribani saqlash"}</button>
            {saved && <button className="btn btn-sec" onClick={() => nav("/experiments")}>Tajribalarimga o'tish</button>}
          </div>
        </div>
      )}
    </div>
  );
}
