import { useEffect, useState } from "react";
import { api } from "../api";
import type { Experiment, ModelMeta } from "../types";

export default function MyExperiments() {
  const [exps, setExps] = useState<Experiment[]>([]);
  const [models, setModels] = useState<ModelMeta[]>([]);
  useEffect(() => { api.experiments().then(setExps).catch(() => {}); api.models().then(setModels).catch(() => {}); }, []);
  const del = async (id: number) => { await api.remove(id); setExps((x) => x.filter((e) => e.id !== id)); };

  return (
    <div>
      <h1 className="text-2xl mb-3">Tajribalarim</h1>
      <div className="card overflow-x-auto">
        {exps.length === 0 ? <p className="text-mute">Hali saqlangan tajriba yo'q.</p> : (
          <table className="w-full text-left">
            <thead className="text-mute"><tr><th className="p-2">Sana</th><th>Savol</th><th>Gipoteza</th><th>Natija</th><th /></tr></thead>
            <tbody>{exps.map((e) => {
              const m = models.find((x) => x.id === e.model_id);
              return (
                <tr key={e.id} className="border-t border-line align-top">
                  <td className="p-2">{new Date(e.created_at).toLocaleDateString("uz")}</td>
                  <td>{e.question}</td><td>{m?.hypotheses[e.hypothesis_index]}</td>
                  <td>{e.result.metric_label}: <b>{e.result.metric_value}</b><br /><span className={`chip ${e.matched ? "text-ok" : "text-warn"}`}>{e.matched ? "Mos" : "Mos emas"}</span></td>
                  <td><button className="text-err" onClick={() => del(e.id)}>O'chirish</button></td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
