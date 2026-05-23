"""
HRMS Backend — FastAPI Application Entry Point
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from app.config import settings
from app.database import engine, Base
from app.routers import auth, health, recruitment, copilot, reports, analytics, employees, dashboard
from app.models.leave import Leave
from app.models.performance import PerformanceReview
from app.services.rag import ingest_hr_policy
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    logger.info("=" * 60)
    logger.info("HRMS Backend Starting Up")
    logger.info(f"Database: {settings.DATABASE_URL}")
    logger.info(f"CORS Origins: {settings.cors_origins_list}")
    logger.info("=" * 60)

    # Create all database tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")

    # Ensure logs directory exists
    os.makedirs("logs", exist_ok=True)
    
    # Initialize RAG vector database
    logger.info("Initializing RAG vector database...")
    ingest_hr_policy()

    yield

    # Shutdown
    logger.info("HRMS Backend Shutting Down")


app = FastAPI(
    title="HRMS — AI-Native HR Management System",
    description="Backend API for the AI-native Human Resource Management System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests and their response times."""
    start_time = datetime.utcnow()
    response = await call_next(request)
    duration = (datetime.utcnow() - start_time).total_seconds()

    logger.info(
        f"{request.method} {request.url.path} — "
        f"Status: {response.status_code} — "
        f"Duration: {duration:.3f}s"
    )
    return response


# Register routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(recruitment.router)
app.include_router(copilot.router)
app.include_router(reports.router)
app.include_router(analytics.router)
app.include_router(dashboard.router)

@app.get("/")
async def root():
    """Root redirect to API docs."""
    return {
        "message": "HRMS Backend API",
        "docs": "/docs",
        "health": "/api/health",
    }
