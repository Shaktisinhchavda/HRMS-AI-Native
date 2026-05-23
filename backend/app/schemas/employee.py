from typing import Optional, List
from pydantic import BaseModel
from datetime import date

class EmployeeBase(BaseModel):
    employee_id: str
    full_name: str
    email: str
    department: str
    designation: str
    salary: float
    status: str
    skills: Optional[str] = None

class EmployeeOut(EmployeeBase):
    id: int
    hire_date: date
    
    class Config:
        from_attributes = True
