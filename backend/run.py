"""
HRMS Backend — Development Server Launcher
"""
import os
import uvicorn

if __name__ == "__main__":
    os.makedirs("logs", exist_ok=True)
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
