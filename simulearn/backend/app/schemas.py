from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["student", "university_student", "teacher"] = "student"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    role: str


class RunIn(BaseModel):
    model_id: str
    params: dict[str, float]


class SweepIn(RunIn):
    n: int = Field(60, ge=10, le=200)


class PlanIn(BaseModel):
    question: str = Field(min_length=3, max_length=500)


class AnalyzeIn(BaseModel):
    model_id: str
    hypothesis_index: int = Field(ge=0, le=3)
    runs: list[dict[str, float]] = Field(min_length=1, max_length=100)


class ExperimentIn(AnalyzeIn):
    question: str = Field(max_length=500)
    hypothesis_note: str = Field("", max_length=1000)


class ExperimentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    model_id: str
    question: str
    hypothesis_index: int
    hypothesis_note: str
    runs: list
    result: dict
    matched: bool
    created_at: datetime
