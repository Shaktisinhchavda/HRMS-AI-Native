from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from app.database import Base

class Leave(Base):
    __tablename__ = "leaves"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days = Column(Integer, nullable=False)
    status = Column(String(50), default="pending", nullable=False) # pending, approved, rejected
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Leave(id={self.id}, emp_id={self.employee_id}, status={self.status})>"
