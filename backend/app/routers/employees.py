from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.employee import Employee
from app.models.user import User
from app.schemas.employee import EmployeeOut
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/employees", tags=["employees"])

@router.get("/", response_model=List[EmployeeOut])
def get_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all employees."""
    # Normally we would paginate, but for 100 seeded rows returning all is fine
    employees = db.query(Employee).order_by(Employee.id.desc()).all()
    return employees
