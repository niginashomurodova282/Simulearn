import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { ModelMeta } from "../types";

const SOON: [string, string][] = [["Ehtimollik tajribalari", "mathematics"], ["Eritmani suyultirish", "chemistry"], ["Reaksiya tezligi", "chemistry"], ["Energiyaning saqlanishi", "physics"]];
const NAMES: Record<string, string> = { mathematics: "Matematika", physics: "Fizika", chemistry: "Kimyo" };

export default function Library() {
  const nav = useNavigate();
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [flt, setFlt] = useState("all");
  const [q, setQ] = useState("");
  useEffect(() => { api.models().then(setModels).catch(() => {}); }, []);
  const match = (s: string, n: string, d: string) => (flt === "all" || s === flt) && (n + d).toLowerCase().includes(q.toLowerCase());

  return (
    <div>
      <h1 className="text-2xl mb-3">Simulyatsiya kutubxonasi</h1>
      <div className="flex gap-2 flex-wrap mb-4">
        {["all", ...Object.keys(NAMES)].map((s) => <button key={s} className={`btn ${flt === s ? "" : "btn-sec"}`} onClick={() => setFlt(s)}>{s === "all" ? "Hammasi" : NAMES[s]}</button>)}
        <input className="input max-w-xs" placeholder="Qidirish…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Qidirish" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {models.filter((m) => match(m.subject, m.name, m.description)).map((m) => (
          <div key={m.id} className="card border-l-4 border-l-acc">
            <span className="chip">{NAMES[m.subject]}</span>
            <h2 className="text-lg mt-2">{m.name}</h2><p className="text-mute">{m.description}</p>
            <span className="chip">{m.difficulty}</span><span className="chip">{m.duration}</span>
            <div className="mt-3"><button className="btn" onClick={() => nav(`/architect?model=${m.id}`)}>Boshlash</button></div>
          </div>
        ))}
        {SOON.filter(([n, s]) => match(s, n, "tez orada")).map(([n, s]) => (
          <div key={n} className="card opacity-55"><span className="chip">{NAMES[s]}</span><h2 className="text-lg mt-2">{n}</h2><p className="text-mute">Tez orada</p></div>
        ))}
      </div>
    </div>
  );
}
