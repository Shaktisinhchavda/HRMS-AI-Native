"""
Candidate Pydantic Schemas
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class CandidateCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = []
    experience_years: Optional[int] = None
    match_score: Optional[int] = None
    ai_summary: Optional[str] = None
    resume_text: str

class CandidateResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: str # Stored as JSON string
    experience_years: Optional[int] = None
    match_score: Optional[int] = None
    ai_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AIParsedResult(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = []
    experience_years: Optional[int] = None
    match_score: int
    summary: str
    raw_text: str
