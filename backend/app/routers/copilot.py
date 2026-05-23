"""
HR Copilot Router
"""
from fastapi import APIRouter, Depends
from app.schemas.copilot import ChatRequest, ChatResponse
from app.services.rag import query_copilot
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/copilot", tags=["copilot"])

from sqlalchemy import text
from app.database import engine

@router.post("/chat", response_model=ChatResponse)
async def chat_with_copilot(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """Chat with the HR Copilot RAG system."""
    performance_score = 0.0
    leave_balance = 20
    working_hours = 0.0
    overworked_hours = 0.0
    salary = 0.0

    with engine.connect() as conn:
        email = current_user.email
        emp_row = conn.execute(text("SELECT id, salary FROM employees WHERE email = :email"), {"email": email}).fetchone()
        
        if emp_row:
            emp_id = emp_row[0]
            salary = emp_row[1]
                
            leave_row = conn.execute(text("SELECT SUM(days) FROM leaves WHERE employee_id = :emp_id AND status = 'approved'"), {"emp_id": emp_id}).scalar()
            leaves_taken = leave_row if leave_row else 0
            leave_balance = max(0, 20 - leaves_taken)
            
            from app.utils.performance import calculate_performance_score
            performance_score, working_hours, overworked_hours = calculate_performance_score(emp_id, leaves_taken, salary)

    user_info = {
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "department": current_user.department,
        "designation": current_user.designation,
        "performance_score": performance_score,
        "leave_balance": leave_balance,
        "working_hours": working_hours,
        "overworked_hours": overworked_hours,
        "salary": salary
    }
    answer = await query_copilot(request.message, user_info=user_info)
    return ChatResponse(response=answer)
