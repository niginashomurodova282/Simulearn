import type { ModelMeta, Run } from "../types";

interface Props { meta: ModelMeta; curve: [number, number][]; runs: Run[]; current?: [number, number] }

export default function Chart({ meta, curve, runs, current }: Props) {
  const W = 330, H = 220, pd = 36;
  const xp = meta.params.find((p) => p.key === meta.x_key)!;
  const pts = runs.map((r) => [r.params[meta.x_key], r.y] as [number, number]);
  const ym = Math.max(1, ...curve.map((c) => c[1]), ...pts.map((c) => c[1])) * 1.08;
  const X = (x: number) => pd + ((x - xp.min) / (xp.max - xp.min)) * (W - pd - 8);
  const Y = (y: number) => H - pd - (y / ym) * (H - pd - 8);
  const d = curve.map((c, i) => `${i ? "L" : "M"}${X(c[0]).toFixed(1)},${Y(c[1]).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${meta.y_label} grafigi`} className="w-full h-auto">
      <line x1={pd} y1={H - pd} x2={W - 8} y2={H - pd} stroke="#44575f" />
      <line x1={pd} y1={8} x2={pd} y2={H - pd} stroke="#44575f" />
      {[0, 1, 2, 3, 4].map((k) => {
        const y = (ym * k) / 4, x = xp.min + ((xp.max - xp.min) * k) / 4;
        return (
          <g key={k}>
            <line x1={pd} x2={W - 8} y1={Y(y)} y2={Y(y)} stroke="#1a262d" />
            <text x={pd - 4} y={Y(y) + 4} textAnchor="end">{y.toFixed(1)}</text>
            <text x={X(x)} y={H - pd + 14} textAnchor="middle">{+x.toFixed(1)}</text>
          </g>
        );
      })}
      <path d={d} fill="none" stroke="#65B9AA" strokeWidth={2} opacity={0.6} />
      {pts.map((c, i) => <circle key={i} cx={X(c[0])} cy={Y(c[1])} r={4} fill="#e7eff2" />)}
      {current && <circle cx={X(current[0])} cy={Y(current[1])} r={5} fill="none" stroke="#D99A52" strokeWidth={2} />}
      <text x={W / 2} y={H - 4} textAnchor="middle">{xp.label} ({xp.unit})</text>
      <text x={4} y={12}>{meta.y_label} ({meta.y_unit})</text>
    </svg>
  );
}
