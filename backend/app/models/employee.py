"""
Employee SQLAlchemy Model
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, Text
from app.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    department = Column(String(100), nullable=False)
    designation = Column(String(100), nullable=False)
    skills = Column(Text, nullable=True) # Stored as JSON string
    salary = Column(Float, nullable=False)
    hire_date = Column(Date, nullable=False)
    exit_risk = Column(String(50), default="low", nullable=False) # low, medium, high
    status = Column(String(50), default="active", nullable=False) # active, inactive
    manager_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Employee(id={self.employee_id}, name='{self.full_name}')>"
