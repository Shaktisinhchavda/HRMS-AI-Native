"""
Analytics Router
"""
from fastapi import APIRouter, Depends
from app.models.user import User
from app.services.auth import require_role
from app.services.analytics import get_attrition_data, get_skill_distribution, get_attendance_anomalies

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/attrition")
async def fetch_attrition_data(current_user: User = Depends(require_role("admin", "hr_manager"))):
    return get_attrition_data()

@router.get("/skills")
async def fetch_skill_data(current_user: User = Depends(require_role("admin", "hr_manager"))):
    return get_skill_distribution()

@router.get("/anomalies")
async def fetch_anomalies(current_user: User = Depends(require_role("admin", "hr_manager"))):
    return get_attendance_anomalies()
