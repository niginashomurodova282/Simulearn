from fastapi import APIRouter, Depends, HTTPException

from ..orm import User
from ..schemas import AnalyzeIn, PlanIn, RunIn, SweepIn
from ..security import current_user
from ..simulation.registry import MODELS, analyze_runs, get_model, meta, validate
from ..ai.architect import plan as ai_plan

router = APIRouter(tags=["simulation"])


def _model(mid):
    try:
        return get_model(mid)
    except ValueError as e:
        raise HTTPException(404, str(e))


def _valid(m, params):
    try:
        return validate(m, params)
    except ValueError as e:
        raise HTTPException(422, str(e))


@router.get("/models")
def models(_: User = Depends(current_user)):
    return [meta(m) for m in MODELS.values()]


@router.post("/sim/run")
def run(data: RunIn, _: User = Depends(current_user)):
    m = _model(data.model_id)
    return m.run(_valid(m, data.params))


@router.post("/sim/sweep")
def sweep(data: SweepIn, _: User = Depends(current_user)):
    m = _model(data.model_id)
    p = _valid(m, data.params)
    x = next(q for q in m.params if q.key == m.x_key)
    pts = []
    for i in range(data.n + 1):
        xv = x.min + (x.max - x.min) * i / data.n
        pts.append([xv, m.run({**p, m.x_key: xv})["y"]])
    return {"x_key": m.x_key, "points": pts}


@router.post("/architect/plan")
def architect_plan(data: PlanIn, _: User = Depends(current_user)):
    mid, source = ai_plan(data.question)
    return {"matched": mid is not None, "source": source,
            "model": meta(MODELS[mid]) if mid else None,
            "alternatives": [meta(m) for m in MODELS.values()]}


@router.post("/architect/analyze")
def architect_analyze(data: AnalyzeIn, _: User = Depends(current_user)):
    m = _model(data.model_id)
    try:
        return analyze_runs(m, data.runs, data.hypothesis_index)
    except ValueError as e:
        raise HTTPException(422, str(e))
