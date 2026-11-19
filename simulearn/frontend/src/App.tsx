import { useEffect, useState } from "react";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { api, hasToken, setToken } from "./api";
import type { User } from "./types";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Architect from "./pages/Architect";
import Library from "./pages/Library";
import MyExperiments from "./pages/MyExperiments";

const NAV: [string, string][] = [["/", "Boshqaruv"], ["/architect", "AI Tajriba"], ["/library", "Kutubxona"], ["/experiments", "Tajribalarim"]];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasToken()) return setReady(true);
    api.me().then(setUser).catch(() => setToken("")).finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  if (!user) return <Auth onAuth={setUser} />;

  return (
    <BrowserRouter>
      <div className="min-h-screen md:grid md:grid-cols-[220px_1fr] pb-16 md:pb-0">
        <aside className="fixed bottom-0 inset-x-0 z-10 flex border-t border-line bg-side md:static md:flex-col md:h-screen md:sticky md:top-0 md:border-t-0 md:border-r md:p-3">
          <div className="hidden md:block font-head font-extrabold text-xl px-3 pb-4">Simu<span className="text-acc">Learn</span></div>
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"}
              className={({ isActive }) => `flex-1 md:flex-none text-center md:text-left px-3 py-3 text-mute hover:text-tx md:border-l-[3px] border-t-[3px] md:border-t-0 ${isActive ? "border-acc text-tx font-bold bg-[#0f1b1f]" : "border-transparent"}`}>
              {label}
            </NavLink>
          ))}
        </aside>
        <div>
          <header className="flex items-center gap-3 justify-end px-5 py-3 border-b border-line bg-side">
            <span className="hidden sm:block">{user.name}</span>
            <span className="w-8 h-8 rounded-full bg-teal grid place-items-center">{user.name[0]?.toUpperCase()}</span>
            <button className="btn btn-sec" onClick={() => { setToken(""); setUser(null); }}>Chiqish</button>
          </header>
          <main className="p-4 md:p-6 max-w-6xl">
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/architect" element={<Architect />} />
              <Route path="/library" element={<Library />} />
              <Route path="/experiments" element={<MyExperiments />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
