"""AI Tajriba me'mori. AI faqat model tanlaydi; hisob-kitob registry orqali bajariladi.

ANTHROPIC_API_KEY bo'lsa LLM savolni modelga moslaydi, aks holda (yoki xatoda) qoidalar ishlaydi.
LLM chiqishi har doim registry bilan tekshiriladi: noma'lum model_id rad etiladi.
"""
import json
import re

from ..config import settings
from ..simulation.registry import MODELS

RULES = {
    "simple_pendulum": r"mayatnik|davr|tebran|pendul|маятник|period",
    "quadratic_function": r"kvadrat|parabol|koeffitsiyent|funksiya|квадрат|парабол",
    "projectile_motion": r"burchak|otil|otish|otib|uzoq|masofa|snaryad|proyekt|projectile|угол|бросок",
}


def match_rules(q: str) -> str | None:
    for mid, rx in RULES.items():
        if re.search(rx, q, re.I):
            return mid
    return None


def match_llm(q: str) -> str | None:
    if not settings.anthropic_api_key:
        return None
    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        catalog = [{"model_id": m.id, "name": m.name, "about": m.description} for m in MODELS.values()]
        msg = client.messages.create(
            model=settings.anthropic_model, max_tokens=100,
            system=("Sen ta'lim platformasi yordamchisisan. Foydalanuvchi savolini quyidagi modellardan biriga moslashtir. "
                    'FAQAT JSON qaytar: {"model_id": "<id yoki null>"}. Moslik bo\'lmasa null. Hisob-kitob qilma.\n'
                    + json.dumps(catalog, ensure_ascii=False)),
            messages=[{"role": "user", "content": q}],
        )
        text = "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")
        mid = json.loads(re.search(r"\{.*\}", text, re.S).group(0)).get("model_id")
        return mid if mid in MODELS else None  # tekshiruv: faqat ro'yxatdagi model
    except Exception:
        return None


def plan(q: str) -> tuple[str | None, str]:
    mid = match_llm(q)
    if mid:
        return mid, "llm"
    return match_rules(q), "rules"
