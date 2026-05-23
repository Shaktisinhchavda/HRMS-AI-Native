"""
Candidate SQLAlchemy Model
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    skills = Column(Text, nullable=True) # Stored as JSON string
    experience_years = Column(Integer, nullable=True)
    match_score = Column(Integer, nullable=True)
    ai_summary = Column(Text, nullable=True)
    resume_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Candidate(id={self.id}, name='{self.name}', score={self.match_score})>"
