"""
Attendance SQLAlchemy Model
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey
from app.database import Base


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String(50), nullable=False) # present, absent, late, half_day, wfh
    check_in = Column(String(50), nullable=True)
    check_out = Column(String(50), nullable=True)
    hours_worked = Column(Float, nullable=True)

    def __repr__(self):
        return f"<Attendance(emp_id={self.employee_id}, date='{self.date}', status='{self.status}')>"
