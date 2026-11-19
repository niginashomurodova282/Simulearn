import { useEffect, useRef, useState } from "react";
import type { ModelMeta, Params, Run, RunOut } from "../types";

interface Props { meta: ModelMeta; params: Params; out: RunOut | null; runs: Run[]; fire: number }

export default function SimView({ meta, params, out, runs, fire }: Props) {
  const [now, setNow] = useState(performance.now());
  const t0 = useRef(performance.now());
  const fireAt = useRef<number | null>(null);
  const reduce = useRef(matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => { if (fire > 0) fireAt.current = performance.now(); }, [fire]);
  useEffect(() => {
    let id = 0;
    const loop = () => { setNow(performance.now()); id = requestAnimationFrame(loop); };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  if (meta.id === "simple_pendulum") {
    const T = out?.y ?? 2;
    const th = reduce.current ? 0 : 0.14 * Math.cos((2 * Math.PI * ((now - t0.current) / 1000)) / T);
    const len = 30 + (params.L ?? 1) * 95;
    const x = 300 + len * Math.sin(th), y = 30 + len * Math.cos(th);
    return (
      <svg viewBox="0 0 600 340" className="w-full h-auto" role="img" aria-label="Mayatnik">
        <rect x={240} y={22} width={120} height={7} rx={3} fill="#44575f" />
        <line x1={300} y1={29} x2={x} y2={y} stroke="#e7eff2" strokeWidth={2} />
        <circle cx={x} cy={y} r={15} fill="#65B9AA" />
      </svg>
    );
  }

  if (meta.id === "quadratic_function") {
    const X = (x: number) => 300 + x * 45, Y = (y: number) => 330 - (y + 10) * 11.4;
    const P = (pts: [number, number][]) => pts.map((p, i) => `${i ? "L" : "M"}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join("");
    const ref = [...Array(61)].map((_, i) => { const x = -6 + (12 * i) / 60; return [x, x * x] as [number, number]; });
    const v = out?.vertex, w = out?.width;
    return (
      <svg viewBox="0 0 600 340" className="w-full h-auto" role="img" aria-label="Parabola grafigi">
        <line x1={0} x2={600} y1={Y(0)} y2={Y(0)} stroke="#44575f" />
        <line x1={X(0)} x2={X(0)} y1={0} y2={340} stroke="#44575f" />
        <path d={P(ref)} fill="none" stroke="#c07ad9" strokeDasharray="4 4" opacity={0.6} />
        <path d={P(out?.parabola ?? [])} fill="none" stroke="#65B9AA" strokeWidth={2.5} />
        {v && w && (<>
          <line x1={X(v[0] - w / 2)} x2={X(v[0] + w / 2)} y1={Y(v[1] + 4)} y2={Y(v[1] + 4)} stroke="#D99A52" strokeWidth={2} />
          <circle cx={X(v[0])} cy={Y(v[1])} r={5} fill="#f3d36b" />
        </>)}
        <text x={8} y={18}>y = {params.a}x² + {params.b}x + {params.c}</text>
        <text x={8} y={34}>Kenglik w = {out?.y.toFixed(2)}</text>
        <text x={8} y={50}>Punktir: y = x² (taqqoslash)</text>
      </svg>
    );
  }

  // otilgan jism
  const traj = out?.trajectory ?? [];
  const all = [...runs.map((r) => r.traj ?? []), traj];
  const mx = Math.max(10, ...all.flat().map((p) => p[0]));
  const hy = Math.max(5, ...all.flat().map((p) => p[1]));
  const s = Math.min(520 / mx, 240 / hy), gy = 300, ox = 50, oy = gy - (params.h ?? 0) * s;
  const P = (t: [number, number][]) => t.map((p, i) => `${i ? "L" : "M"}${(ox + p[0] * s).toFixed(1)},${(gy - p[1] * s).toFixed(1)}`).join("");
  let ball: [number, number] | null = null;
  if (fireAt.current && out?.time && traj.length) {
    const el = (now - fireAt.current) / 1000;
    if (el < out.time) {
      const f = (el / out.time) * 60, i = Math.floor(f), a = traj[i], b = traj[Math.min(60, i + 1)];
      ball = [a[0] + (b[0] - a[0]) * (f - i), a[1] + (b[1] - a[1]) * (f - i)];
    }
  }
  return (
    <svg viewBox="0 0 600 340" className="w-full h-auto" role="img" aria-label="Otilgan jism trayektoriyasi">
      <rect x={0} y={gy} width={600} height={40} fill="#0f2a1f" />
      <line x1={0} x2={600} y1={gy} y2={gy} stroke="#4D9B7C" />
      {runs.map((r, i) => <path key={i} d={P(r.traj ?? [])} fill="none" stroke="#c07ad9" strokeDasharray="3 3" opacity={0.7} />)}
      <path d={P(traj)} fill="none" stroke="#65B9AA" opacity={0.4} />
      <rect x={ox - 6} y={oy} width={12} height={gy - oy} fill="#2a3b44" />
      <g transform={`rotate(${-(params.a ?? 0)} ${ox} ${oy})`}><rect x={ox - 10} y={oy - 9} width={44} height={18} rx={4} fill="#d9534f" /></g>
      <circle cx={ox} cy={oy} r={9} fill="#6b7d86" />
      {ball && <circle cx={ox + ball[0] * s} cy={gy - ball[1] * s} r={7} fill="#f3d36b" />}
      <rect x={8} y={8} width={175} height={64} rx={6} fill="#0d1418" stroke="#1a262d" />
      <text x={18} y={28}>Vaqt: {out?.time?.toFixed(2)} s</text>
      <text x={18} y={44}>Masofa: {out?.y.toFixed(2)} m</text>
      <text x={18} y={60}>Balandlik: {out?.max_height?.toFixed(2)} m</text>
    </svg>
  );
}
