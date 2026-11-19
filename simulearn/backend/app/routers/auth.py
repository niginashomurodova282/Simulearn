from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..orm import User
from ..schemas import LoginIn, RegisterIn, TokenOut, UserOut
from ..security import create_token, current_user, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=TokenOut, status_code=201)
@limiter.limit("10/minute")
def register(request: Request, data: RegisterIn, db: Session = Depends(get_db)):
    email = data.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "Bu email bilan hisob mavjud")
    u = User(email=email, name=data.name.strip(), role=data.role, password_hash=hash_password(data.password))
    db.add(u)
    db.commit()
    return TokenOut(access_token=create_token(u.id))


@router.post("/login", response_model=TokenOut)
@limiter.limit("10/minute")
def login(request: Request, data: LoginIn, db: Session = Depends(get_db)):
    u = db.scalar(select(User).where(User.email == data.email.lower()))
    if not u or not verify_password(data.password, u.password_hash):
        raise HTTPException(401, "Email yoki parol noto'g'ri")
    return TokenOut(access_token=create_token(u.id))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user
