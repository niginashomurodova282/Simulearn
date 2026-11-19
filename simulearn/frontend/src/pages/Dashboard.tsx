import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Experiment, ModelMeta, User } from "../types";

const SUBJECTS: [string, string, string][] = [["mathematics", "Matematika", "#7aa7e8"], ["physics", "Fizika", "#65B9AA"], ["chemistry", "Kimyo", "#D99A52"]];

export default function Dashboard({ user }: { user: User }) {
  const nav = useNavigate();
  const [exps, setExps] = useState<Experiment[]>([]);
  const [models, setModels] = useState<ModelMeta[]>([]);
  useEffect(() => { api.experiments().then(setExps).catch(() => {}); api.models().then(setModels).catch(() => {}); }, []);
  const matched = exps.filter((e) => e.matched).length;
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 864e5);
    return { l: d.toLocaleDateString("uz", { weekday: "short" }), c: exps.filter((e) => new Date(e.created_at).toDateString() === d.toDateString()).length };
  });
  const mx = Math.max(1, ...days.map((d) => d.c));

  return (
    <div className="grid gap-4">
      <section className="rounded-xl border border-[#21424e] bg-gradient-to-br from-[#163B4A] via-[#0d2430] to-card p-6">
        <p className="text-mute">Salom, {user.name}. Bugun nimani kashf qilamiz?</p>
        <h1 className="text-2xl md:text-3xl max-w-[22ch] mt-1">Savolingizni ilmiy tajribaga aylantiring.</h1>
        <p className="text-[#a9c9c3] max-w-xl my-2">Gipoteza tuzing, tajribani rejalashtiring va natijalarni tahlil qiling.</p>
        <button className="btn" onClick={() => nav("/architect")}>Tajriba yaratish</button>
      </section>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[["Saqlangan tajribalar", exps.length], ["Fanlar", new Set(exps.map((e) => models.find((m) => m.id === e.model_id)?.subject)).size],
          ["Gipoteza mosligi", exps.length ? Math.round((matched / exps.length) * 100) + "%" : "—"], ["Tayyor modellar", models.length]].map(([l, v]) => (
          <div key={l as string} className="card"><span className="text-mute">{l}</span><b className="block font-head text-2xl">{v}</b></div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {SUBJECTS.map(([id, name, c]) => {
          const n = models.filter((m) => m.subject === id).length;
          return (
            <button key={id} onClick={() => nav("/library")} style={{ borderLeftColor: c }} className="card border-l-4 text-left hover:brightness-125">
              <b className="font-head">{name}</b><span className="block text-mute">{n ? `${n} ta tayyor tajriba` : "Tez orada"}</span>
            </button>
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg mb-2">Haftalik faollik</h2>
          <svg viewBox="0 0 320 130" role="img" aria-label="Haftalik faollik">
            {days.map((d, i) => (
              <g key={i}>
                <rect x={i * 45 + 12} y={100 - (d.c / mx) * 85} width={26} height={(d.c / mx) * 85} rx={3} fill="#65B9AA" />
                <text x={i * 45 + 25} y={118} textAnchor="middle">{d.l}</text>
                {d.c > 0 && <text x={i * 45 + 25} y={94 - (d.c / mx) * 85} textAnchor="middle">{d.c}</text>}
              </g>
            ))}
            <line x1={0} x2={320} y1={100} y2={100} stroke="#1a262d" />
          </svg>
        </div>
        <div className="card">
          <h2 className="text-lg mb-2">So'nggi tajribalar</h2>
          {exps.length === 0 ? <p className="text-mute">Hali tajriba saqlanmagan.</p> : (
            <table className="w-full">
              <tbody>{exps.slice(0, 5).map((e) => (
                <tr key={e.id} className="border-b border-line">
                  <td className="py-2">{models.find((m) => m.id === e.model_id)?.name ?? e.model_id}<br /><span className="text-mute">{new Date(e.created_at).toLocaleDateString("uz")}</span></td>
                  <td className="text-right"><span className="chip">{e.matched ? "Mos" : "Mos emas"}</span></td>
                </tr>))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
