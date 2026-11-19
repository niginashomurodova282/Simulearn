"""Tekshirilgan (deterministik) simulyatsiya modellari.

AI bu fayldagi formulalarni o'zgartira olmaydi va hisoblamaydi: u faqat model_id
va parametrlarni tavsiya qiladi, ularni esa validate() tekshiradi.
"""
from dataclasses import dataclass
from math import cos, log, pi, radians, sin, sqrt
from typing import Callable


@dataclass(frozen=True)
class Param:
    key: str
    label: str
    unit: str
    min: float
    max: float
    step: float
    default: float


@dataclass(frozen=True)
class SimModel:
    id: str
    subject: str
    name: str
    description: str
    difficulty: str
    duration: str
    equation: str
    assumptions: str
    params: tuple[Param, ...]
    x_key: str
    y_label: str
    y_unit: str
    hint: str
    prompt: str
    hypotheses: tuple[str, str, str, str]  # 0=o'sadi, 1=cho'qqi/sekinroq, 2=kamayadi, 3=o'zgarmaydi
    plan: tuple[tuple[str, str], ...]
    need: str
    next_text: str
    next_set: dict
    run: Callable[[dict], dict]
    analyze: Callable[["SimModel", list[dict]], dict | None]


def _pendulum(p):
    t = 2 * pi * sqrt(p["L"] / p["g"])
    return {"y": t, "period": t}


def _projectile(p):
    a = radians(p["a"])
    vx, vy = p["v"] * cos(a), p["v"] * sin(a)
    t = (vy + sqrt(vy * vy + 2 * p["g"] * p["h"])) / p["g"]
    traj = []
    for i in range(61):
        tt = t * i / 60
        traj.append([vx * tt, max(0.0, p["h"] + vy * tt - 0.5 * p["g"] * tt * tt)])
    return {"y": vx * t, "range": vx * t, "time": t, "max_height": p["h"] + vy * vy / (2 * p["g"]), "trajectory": traj}


def _an_pendulum(m, runs):
    g0 = runs[0]["g"]
    pts = [(r["L"], m.run(r)["y"]) for r in runs if r["g"] == g0]
    if len({x for x, _ in pts}) < 3:
        return None
    xs, ys = [log(x) for x, _ in pts], [log(y) for _, y in pts]
    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
    n = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
    truth = 2 if n < -0.1 else 3 if abs(n) < 0.1 else 0 if n >= 0.85 else 1
    return {"metric_label": "Daraja n (T ∝ Lⁿ)", "metric_value": f"{n:.2f}", "truth_index": truth,
            "why": "Nazariya: T ∝ L^0.5. Uzunlik 4 baravar oshsa, davr 2 baravar oshadi."}


def _an_projectile(m, runs):
    k = runs[0]
    same = [r for r in runs if (r["v"], r["h"], r["g"]) == (k["v"], k["h"], k["g"])]
    pts = sorted({r["a"]: m.run(r)["y"] for r in same}.items())
    if len(pts) < 4:
        return None
    ys = [y for _, y in pts]
    i = ys.index(max(ys))
    spread = (max(ys) - min(ys)) / max(ys)
    truth = 3 if spread < 0.03 else 2 if i == 0 else 0 if i == len(pts) - 1 else 1
    return {"metric_label": "Eng uzoq masofa burchagi", "metric_value": f"{pts[i][0]:g}°", "truth_index": truth,
            "why": "Nazariya: h = 0 da R = v²·sin2θ/g, maksimum 45° da. Boshlang'ich balandlik bo'lsa, optimal burchak 45° dan kichik."}


def _quadratic(p):
    a, b, c = p["a"], p["b"], p["c"]
    w = 4 / sqrt(a)  # cho'qqidan 4 birlik balandlikda parabola kengligi
    xs = [-6 + 12 * i / 60 for i in range(61)]
    return {"y": w, "width": w, "vertex": [-b / (2 * a), c - b * b / (4 * a)],
            "parabola": [[x, a * x * x + b * x + c] for x in xs]}


def _an_quadratic(m, runs):
    k = runs[0]
    same = [r for r in runs if (r["b"], r["c"]) == (k["b"], k["c"])]
    pts = {r["a"]: m.run(r)["y"] for r in same}
    if len(pts) < 3:
        return None
    xs, ys = [log(a) for a in pts], [log(w) for w in pts.values()]
    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
    n = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
    truth = 0 if n > 0.1 else 3 if abs(n) <= 0.1 else 1
    return {"metric_label": "Daraja n (kenglik ∝ aⁿ)", "metric_value": f"{n:.2f}", "truth_index": truth,
            "why": "Nazariya: kenglik w = 4/√a, ya'ni n = −0.5. a oshsa parabola torayadi; b va c esa parabolani faqat siljitadi, kengligini o'zgartirmaydi."}


G = Param("g", "Tezlanish g", "m/s²", 1, 25, 0.01, 9.81)

MODELS: dict[str, SimModel] = {m.id: m for m in [
    SimModel(
        id="simple_pendulum", subject="physics", name="Oddiy mayatnik", description="Uzunlik va tebranish davri",
        difficulty="Oson", duration="10 daq", equation="T = 2π√(L/g)",
        assumptions="Kichik burchak (≤10°), ishqalanish yo'q, ip massasiz.",
        params=(Param("L", "Uzunlik L", "m", 0.2, 3, 0.05, 1.0), G), x_key="L", y_label="Davr T", y_unit="s", prompt="uzunlik oshsa, davr nima bo'ladi?",
        hint="Ipni 4 baravar uzaytirsangiz, davr necha baravar o'zgaradi deb o'ylaysiz?",
        hypotheses=("Davr uzunlikka chiziqli o'sadi", "Davr oshadi, lekin sekinroq (chiziqli emas)", "Davr kamayadi", "Davr o'zgarmaydi"),
        plan=(("Model", "simple_pendulum"), ("Mustaqil o'zgaruvchi", "Uzunlik L, 0.2–3.0 m"), ("Bog'liq o'zgaruvchi", "Davr T, s"),
              ("Nazorat qilinadigan", "Tezlanish g, boshlang'ich burchak"), ("Kuzatish", "Kamida 3 xil L uchun T ni yozing")),
        need="Tahlil uchun kamida 3 xil uzunlikda (bir xil g) o'lchov yozing.",
        next_text="Davr gravitatsiyaga qanday bog'liq? L = 1 m da g ni o'zgartiring (Oy 1.62, Mars 3.71, Yer 9.81). Bashorat: T ∝ g^-0.5.",
        next_set={"L": 1.0, "g": 1.62}, run=_pendulum, analyze=_an_pendulum),
    SimModel(
        id="projectile_motion", subject="physics", name="Otilgan jism", description="Otish burchagi va uchish masofasi",
        difficulty="O'rta", duration="15 daq", equation="R = v·cosθ·(v·sinθ + √(v²sin²θ + 2gh)) / g",
        assumptions="Havo qarshiligi yo'q, tekis yer, g o'zgarmas.",
        params=(Param("v", "Boshlang'ich tezlik", "m/s", 5, 30, 1, 17), Param("a", "Burchak θ", "°", 0, 90, 1, 45),
                Param("h", "Boshlang'ich balandlik", "m", 0, 10, 0.5, 0), G),
        x_key="a", y_label="Masofa R", y_unit="m", prompt="burchak oshsa, masofa nima bo'ladi?",
        hint="0° va 90° da jism qayerga tushadi? Oraliqda nima bo'lishi mumkin?",
        hypotheses=("Burchak oshgani sari masofa doim oshadi", "Masofa avval oshadi, keyin kamayadi",
                    "Burchak oshgani sari masofa kamayadi", "Masofa burchakka bog'liq emas"),
        plan=(("Model", "projectile_motion"), ("Mustaqil o'zgaruvchi", "Burchak θ, 0–90°"), ("Bog'liq o'zgaruvchi", "Masofa R, m"),
              ("Nazorat qilinadigan", "Tezlik v, balandlik h, tezlanish g"), ("Kuzatish", "Kamida 4 xil burchakda otib ko'ring")),
        need="Tahlil uchun kamida 4 xil burchakda (bir xil v, h, g) otib ko'ring.",
        next_text="Boshlang'ich balandlik optimal burchakni o'zgartiradimi? h = 10 m qilib burchaklarni qayta sinang. Bashorat: maksimum 45° dan kichik burchakda.",
        next_set={"a": 45.0, "h": 10.0}, run=_projectile, analyze=_an_projectile),
    SimModel(
        id="quadratic_function", subject="mathematics", name="Kvadrat funksiya", description="Koeffitsiyent a va parabola kengligi",
        difficulty="Oson", duration="10 daq", equation="y = ax² + bx + c;  kenglik w = 4/√a",
        assumptions="a > 0 (yuqoriga ochiq parabola). Kenglik cho'qqidan 4 birlik balandlikda o'lchanadi.",
        params=(Param("a", "Koeffitsiyent a", "birlik", 0.2, 3, 0.1, 1.0), Param("b", "Koeffitsiyent b", "birlik", -5, 5, 0.5, 0.0),
                Param("c", "Koeffitsiyent c", "birlik", -5, 5, 0.5, 0.0)),
        x_key="a", y_label="Parabola kengligi w", y_unit="birlik", prompt="a koeffitsiyenti oshsa, parabola kengligi nima bo'ladi?",
        hint="y = x² va y = 3x² grafiklarini tasavvur qiling. Qaysi biri yupqaroq?",
        hypotheses=("Parabola kengayadi", "Parabola torayadi", "Avval torayadi, keyin kengayadi", "Kengligi o'zgarmaydi"),
        plan=(("Model", "quadratic_function"), ("Mustaqil o'zgaruvchi", "Koeffitsiyent a, 0.2–3.0"), ("Bog'liq o'zgaruvchi", "Parabola kengligi w"),
              ("Nazorat qilinadigan", "Koeffitsiyentlar b va c"), ("Kuzatish", "Kamida 3 xil a uchun w ni yozing")),
        need="Tahlil uchun kamida 3 xil a qiymatida (bir xil b, c) o'lchov yozing.",
        next_text="b koeffitsiyenti nima qiladi? a = 1 da b ni o'zgartirib, cho'qqi qayerga siljishini kuzating. Bashorat: cho'qqi x = −b/(2a) nuqtada.",
        next_set={"a": 1.0, "b": 4.0}, run=_quadratic, analyze=_an_quadratic),
]}


def get_model(model_id: str) -> SimModel:
    if model_id not in MODELS:
        raise ValueError(f"Noma'lum model: {model_id}")
    return MODELS[model_id]


def validate(model: SimModel, params: dict) -> dict:
    keys = {p.key for p in model.params}
    if set(params) != keys:
        raise ValueError(f"Parametrlar to'plami noto'g'ri. Kerak: {sorted(keys)}")
    out = {}
    for p in model.params:
        v = float(params[p.key])
        if not (p.min <= v <= p.max):
            raise ValueError(f"{p.label} {p.min}–{p.max} {p.unit} oralig'ida bo'lishi kerak")
        out[p.key] = v
    return out


def meta(m: SimModel) -> dict:
    return {"id": m.id, "subject": m.subject, "name": m.name, "description": m.description, "difficulty": m.difficulty,
            "duration": m.duration, "equation": m.equation, "assumptions": m.assumptions, "x_key": m.x_key,
            "y_label": m.y_label, "y_unit": m.y_unit, "hint": m.hint, "prompt": m.prompt, "hypotheses": list(m.hypotheses),
            "plan": [list(r) for r in m.plan], "need": m.need, "next_text": m.next_text, "next_set": m.next_set,
            "params": [p.__dict__ for p in m.params]}


def analyze_runs(model: SimModel, runs: list[dict], hypothesis_index: int) -> dict:
    clean = [validate(model, r) for r in runs]
    res = model.analyze(model, clean)
    if res is None:
        raise ValueError(model.need)
    res["matched"] = res["truth_index"] == hypothesis_index
    res["truth_text"] = model.hypotheses[res["truth_index"]]
    return res
