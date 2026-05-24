"""
Candidate Pydantic Schemas — Advanced Resume Parsing
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class EducationEntry(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    year: Optional[str] = None

class WorkExperienceEntry(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    duration: Optional[str] = None
    highlights: List[str] = []

class CandidateCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    current_title: Optional[str] = None
    skills: List[str] = []
    experience_years: Optional[int] = None
    match_score: Optional[int] = None
    ai_summary: Optional[str] = None
    education: List[EducationEntry] = []
    work_experience: List[WorkExperienceEntry] = []
    certifications: List[str] = []
    languages: List[str] = []
    strengths: List[str] = []
    weaknesses: List[str] = []
    resume_text: str

class CandidateResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: str  # Stored as JSON string
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
    location: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    current_title: Optional[str] = None
    skills: List[str] = []
    experience_years: Optional[int] = None
    match_score: int = 50
    summary: str = ""
    education: List[EducationEntry] = []
    work_experience: List[WorkExperienceEntry] = []
    certifications: List[str] = []
    languages: List[str] = []
    strengths: List[str] = []
    weaknesses: List[str] = []
    raw_text: str = ""
