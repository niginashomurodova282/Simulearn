from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..orm import Experiment, User
from ..schemas import ExperimentIn, ExperimentOut
from ..security import current_user
from ..simulation.registry import analyze_runs, get_model

router = APIRouter(prefix="/experiments", tags=["experiments"])


@router.get("", response_model=list[ExperimentOut])
def list_mine(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Experiment).where(Experiment.user_id == user.id).order_by(Experiment.created_at.desc())).all()


@router.post("", response_model=ExperimentOut, status_code=201)
def create(data: ExperimentIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    try:
        m = get_model(data.model_id)
        res = analyze_runs(m, data.runs, data.hypothesis_index)  # natija serverda qayta hisoblanadi
    except ValueError as e:
        raise HTTPException(422, str(e))
    e = Experiment(user_id=user.id, model_id=data.model_id, question=data.question, hypothesis_index=data.hypothesis_index,
                   hypothesis_note=data.hypothesis_note, runs=data.runs, result=res, matched=res["matched"])
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


@router.delete("/{exp_id}", status_code=204)
def delete(exp_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    e = db.get(Experiment, exp_id)
    if not e or e.user_id != user.id:
        raise HTTPException(404, "Topilmadi")
    db.delete(e)
    db.commit()
