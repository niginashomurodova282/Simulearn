export interface User { id: number; name: string; email: string; role: string }
export interface Param { key: string; label: string; unit: string; min: number; max: number; step: number; default: number }
export interface ModelMeta {
  id: string; subject: string; name: string; description: string; difficulty: string; duration: string;
  equation: string; assumptions: string; x_key: string; y_label: string; y_unit: string; hint: string; prompt: string;
  hypotheses: string[]; plan: [string, string][]; need: string; next_text: string; next_set: Record<string, number>;
  params: Param[];
}
export type Params = Record<string, number>;
export interface RunOut { y: number; width?: number; vertex?: [number, number]; parabola?: [number, number][]; time?: number; max_height?: number; trajectory?: [number, number][] }
export interface Run { params: Params; y: number; traj?: [number, number][] }
export interface Analysis { metric_label: string; metric_value: string; truth_index: number; truth_text: string; why: string; matched: boolean }
export interface Experiment {
  id: number; model_id: string; question: string; hypothesis_index: number; hypothesis_note: string;
  runs: Params[]; result: Analysis; matched: boolean; created_at: string;
}
