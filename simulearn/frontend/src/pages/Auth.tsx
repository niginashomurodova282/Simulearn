import { FormEvent, useState } from "react";
import { api, setToken } from "../api";
import type { User } from "../types";

export default function Auth({ onAuth }: { onAuth: (u: User) => void }) {
  const [reg, setReg] = useState(false);
  const [f, setF] = useState({ name: "", email: "", password: "", role: "student" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const t = reg ? await api.register(f) : await api.login({ email: f.email, password: f.password });
      setToken(t.access_token);
      onAuth(await api.me());
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#163B4A] via-[#0b2230] to-[#061219] p-8 md:p-12 flex flex-col justify-end min-h-[220px]">
        <svg className="absolute inset-0 w-full h-full opacity-50" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
          <path d="M-20 300 L200 140 L420 300 L200 460Z" fill="none" stroke="#65B9AA" />
          <path d="M-20 420 L200 260 L420 420 L200 580Z" fill="none" stroke="#65B9AA" opacity=".6" />
          <path d="M0 120 Q100 40 200 120 T400 120" fill="none" stroke="#65B9AA" strokeWidth="1.5" />
        </svg>
        <div className="relative">
          <div className="font-head font-extrabold text-xl mb-auto">Simu<span className="text-acc">Learn</span></div>
          <h1 className="text-3xl md:text-4xl mt-16 max-w-[14ch]">O'rgan. Tajriba qil. Kashf et.</h1>
          <p className="text-[#a9c9c3] max-w-sm mt-2">Gipoteza tuzing, tajribani rejalashtiring va tekshirilgan model asosida natijalarni tahlil qiling.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm grid gap-3">
          <h2 className="text-2xl">{reg ? "Ro'yxatdan o'tish" : "Hisobga kirish"}</h2>
          {reg && <label className="grid gap-1 text-mute">To'liq ism<input className="input" required minLength={2} value={f.name} onChange={set("name")} /></label>}
          <label className="grid gap-1 text-mute">Email<input className="input" type="email" required value={f.email} onChange={set("email")} /></label>
          <label className="grid gap-1 text-mute">Parol{reg && " (kamida 8 belgi)"}<input className="input" type="password" required minLength={reg ? 8 : 1} value={f.password} onChange={set("password")} /></label>
          {reg && (
            <label className="grid gap-1 text-mute">Foydalanuvchi turi
              <select className="input" value={f.role} onChange={set("role")}>
                <option value="student">O'quvchi</option><option value="university_student">Talaba</option><option value="teacher">O'qituvchi</option>
              </select>
            </label>
          )}
          <div className="text-err min-h-[18px]" role="alert">{err}</div>
          <button className="btn" disabled={busy}>{reg ? "Hisob yaratish" : "Kirish"}</button>
          <button type="button" className="btn btn-sec" onClick={() => { setReg(!reg); setErr(""); }}>{reg ? "Hisobim bor" : "Yangi hisob"}</button>
        </form>
      </div>
    </div>
  );
}
