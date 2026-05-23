"""
Health Check Router
"""
from datetime import datetime
from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "service": "HRMS Backend",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
    }
