from fastapi import APIRouter, Depends
from sqlalchemy import text
from app.database import engine
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/overview")
def get_dashboard_overview(current_user: User = Depends(get_current_user)):
    with engine.connect() as conn:
        if current_user.role in ["admin", "hr_manager"]:
            # --- Admin/HR View ---
            total_emp = conn.execute(text("SELECT COUNT(*) FROM employees")).scalar()
            
            high_risk = conn.execute(text("SELECT COUNT(*) FROM employees WHERE exit_risk = 'high'")).scalar()
            attrition_rate = (high_risk / total_emp * 100) if total_emp > 0 else 0
            
            open_positions = 12
            
            recent_emps = conn.execute(text("SELECT full_name, hire_date FROM employees ORDER BY id DESC LIMIT 3")).fetchall()
            activities = []
            for emp in recent_emps:
                activities.append({
                    "title": f"New employee onboarded: {emp[0]}",
                    "subtitle": "System Admin \u2022 recently added"
                })
                
            risk_dept_query = text("""
                SELECT department, COUNT(*) as count 
                FROM employees 
                WHERE exit_risk = 'high' 
                GROUP BY department 
                ORDER BY count DESC 
                LIMIT 1
            """)
            worst_dept_row = conn.execute(risk_dept_query).fetchone()
            
            if worst_dept_row:
                dept_name = worst_dept_row[0]
                alert_text = f"{dept_name} department is showing a significantly high concentration of attrition risk indicators."
            else:
                alert_text = "All departments are currently showing stable retention metrics."
                
            return {
                "role": "admin",
                "total_employees": total_emp,
                "open_positions": open_positions,
                "predicted_attrition_rate": round(attrition_rate, 1),
                "recent_activities": activities,
                "alert": alert_text
            }
        else:
            # --- Employee View ---
            email = current_user.email
            emp_row = conn.execute(text("SELECT id, salary FROM employees WHERE email = :email"), {"email": email}).fetchone()
            
            performance_score = 0.0
            leave_balance = 20
            weekly_hours = 0.0
            
            if emp_row:
                emp_id = emp_row[0]
                salary = emp_row[1]
                
                leave_row = conn.execute(text("SELECT SUM(days) FROM leaves WHERE employee_id = :emp_id AND status = 'approved'"), {"emp_id": emp_id}).scalar()
                leaves_taken = leave_row if leave_row else 0
                leave_balance = max(0, 20 - leaves_taken)
                
                from app.utils.performance import calculate_performance_score
                performance_score, weekly_hours, _ = calculate_performance_score(emp_id, leaves_taken, salary)
            
            return {
                "role": "employee",
                "performance_score": performance_score,
                "leave_balance": leave_balance,
                "weekly_hours": weekly_hours,
                "attendance_status": "Good",
                "recent_activities": [
                    {
                        "title": "Weekly check-in completed",
                        "subtitle": "Manager \u2022 2 days ago"
                    }
                ],
                "alert": "Your Q2 Performance Review is scheduled for next week. Please prepare your self-assessment."
            }
