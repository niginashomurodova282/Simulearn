import type { Analysis, Experiment, ModelMeta, Params, RunOut, User } from "./types";

// Railway'dagi backend manzili
const API_BASE_URL = "https://simulearn-production-63645f7a.up.railway.app";

let token = localStorage.getItem("sl_token") || "";
export const hasToken = () => !!token;
export const setToken = (t: string) => {
  token = t;
  t ? localStorage.setItem("sl_token", t) : localStorage.removeItem("sl_token");
};

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const r = await fetch(API_BASE_URL + path, {
    ...opts,
    headers: { 
      "Content-Type": "application/json", 
      ...(token ? { Authorization: `Bearer ${token}` } : {}) 
    },
  });
  if (!r.ok) {
    let msg = "Xatolik yuz berdi";
    try {
      const j = await r.json();
      msg = typeof j.detail === "string" ? j.detail : "Kiritilgan ma'lumot noto'g'ri";
    } catch { /* bo'sh javob */ }
    throw new Error(msg);
  }
  return r.status === 204 ? (undefined as T) : r.json();
}
const post = <T,>(p: string, b: unknown) => req<T>(p, { method: "POST", body: JSON.stringify(b) });

export const api = {
  register: (b: { name: string; email: string; password: string; role: string }) => post<{ access_token: string }>("/auth/register", b),
  login: (b: { email: string; password: string }) => post<{ access_token: string }>("/auth/login", b),
  me: () => req<User>("/auth/me"),
  models: () => req<ModelMeta[]>("/models"),
  run: (model_id: string, params: Params) => post<RunOut>("/sim/run", { model_id, params }),
  sweep: (model_id: string, params: Params) => post<{ points: [number, number][] }>("/sim/sweep", { model_id, params }),
  plan: (question: string) => post<{ matched: boolean; source: string; model: ModelMeta | null; alternatives: ModelMeta[] }>("/architect/plan", { question }),
  analyze: (model_id: string, hypothesis_index: number, runs: Params[]) => post<Analysis>("/architect/analyze", { model_id, hypothesis_index, runs }),
  experiments: () => req<Experiment[]>("/experiments"),
  save: (b: { model_id: string; question: string; hypothesis_index: number; hypothesis_note: string; runs: Params[] }) => post<Experiment>("/experiments", b),
  remove: (id: number) => req<void>(`/experiments/${id}`, { method: "DELETE" }),
};