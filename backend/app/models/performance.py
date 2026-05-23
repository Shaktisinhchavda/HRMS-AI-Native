from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Date, DateTime, ForeignKey
from app.database import Base

class PerformanceReview(Base):
    __tablename__ = "performance_reviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    score = Column(Float, nullable=False)
    review_date = Column(Date, nullable=False)
    reviewer_id = Column(Integer, nullable=True)
    comments = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<PerformanceReview(id={self.id}, emp_id={self.employee_id}, score={self.score})>"
