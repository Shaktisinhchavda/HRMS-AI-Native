"""
Payroll SQLAlchemy Model
"""
from sqlalchemy import Column, Integer, Float, ForeignKey, String
from app.database import Base


class Payroll(Base):
    __tablename__ = "payroll"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    month = Column(Integer, nullable=False) # 1-12
    year = Column(Integer, nullable=False)
    base_salary = Column(Float, nullable=False)
    overtime_pay = Column(Float, default=0.0, nullable=False)
    deductions = Column(Float, default=0.0, nullable=False)
    bonus = Column(Float, default=0.0, nullable=False)
    net_pay = Column(Float, nullable=False)
    status = Column(String(50), default="paid", nullable=False) # paid, pending

    def __repr__(self):
        return f"<Payroll(emp_id={self.employee_id}, period='{self.month}/{self.year}', net='{self.net_pay}')>"
