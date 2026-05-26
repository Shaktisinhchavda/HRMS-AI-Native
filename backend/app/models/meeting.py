"""
Meeting SQLAlchemy Model — Meeting Attendance & Transcript Tracking
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Float
from app.database import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    attendees = Column(Text, nullable=True)       # JSON list of names
    matched_employees = Column(Text, nullable=True) # JSON list of matched employee IDs
    absent_employees = Column(Text, nullable=True)  # JSON list of names NOT present
    transcript = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    action_items = Column(Text, nullable=True)     # JSON list of action items
    duration_minutes = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Meeting(id={self.id}, title='{self.title}')>"
