"""
Analytics Service (Attrition & Skill Gaps)
"""
from sqlalchemy import text
from app.database import engine

def get_attrition_data():
    """Returns dynamically calculated attrition risk counts based on salary and burnout (overtime)."""
    with engine.connect() as conn:
        # Fetch employees
        emp_query = text("SELECT id, employee_id, full_name, department, designation, salary FROM employees")
        employees = conn.execute(emp_query).fetchall()
        
        # Fetch overtime per employee over 3 months
        payroll_query = text("SELECT employee_id, SUM(overtime_pay) FROM payroll GROUP BY employee_id")
        payroll_result = conn.execute(payroll_query).fetchall()
        overtime_map = {row[0]: row[1] for row in payroll_result}
        
        # Calculate department averages
        dept_salaries = {}
        for emp in employees:
            dept = emp[3]
            sal = emp[5]
            if dept not in dept_salaries:
                dept_salaries[dept] = []
            dept_salaries[dept].append(sal)
            
        dept_avg_sal = {k: sum(v)/len(v) for k, v in dept_salaries.items()}
        
        overall = {"low": 0, "medium": 0, "high": 0}
        departments = {}
        high_risk_list = []
        
        for emp in employees:
            emp_id_db = emp[0]
            emp_id_str = emp[1]
            full_name = emp[2]
            dept = emp[3]
            designation = emp[4]
            salary = emp[5]
            
            overtime = overtime_map.get(emp_id_db, 0)
            avg_sal = dept_avg_sal.get(dept, salary)
            
            # Calculate Risk Score
            score = 0
            
            # Compensation Risk
            if salary < avg_sal * 0.8:
                score += 3
            elif salary < avg_sal * 0.9:
                score += 1
                
            # Burnout Risk
            if overtime > 1000:
                score += 3
            elif overtime > 500:
                score += 1
                
            # Categorize Risk
            if score >= 4:
                risk = "high"
            elif score >= 2:
                risk = "medium"
            else:
                risk = "low"
                
            # Aggregate Overall
            overall[risk] += 1
            
            # Aggregate Department
            if dept not in departments:
                departments[dept] = {"low": 0, "medium": 0, "high": 0}
            departments[dept][risk] += 1
            
            if risk == "high":
                high_risk_list.append({
                    "score": score,
                    "employee_id": emp_id_str,
                    "full_name": full_name,
                    "department": dept,
                    "designation": designation
                })
                
        # Sort high risk by score descending, take top 5
        high_risk_list.sort(key=lambda x: x["score"], reverse=True)
        top_5 = high_risk_list[:5]
        
        return {
            "overall": overall,
            "departments": [{"name": k, **v} for k, v in departments.items()],
            "high_risk_employees": [{"employee_id": e["employee_id"], "full_name": e["full_name"], "department": e["department"], "designation": e["designation"]} for e in top_5]
        }

def get_skill_distribution():
    """Returns the frequency of each skill per department."""
    with engine.connect() as conn:
        query = text("SELECT department, skills FROM employees")
        result = conn.execute(query).fetchall()
        
        dept_skills = {}
        overall_skills = {}
        
        for row in result:
            dept = row[0]
            skills_str = row[1]
            if not skills_str:
                continue
                
            skills_list = [s.strip() for s in skills_str.split(",")]
            
            if dept not in dept_skills:
                dept_skills[dept] = {}
                
            for skill in skills_list:
                dept_skills[dept][skill] = dept_skills[dept].get(skill, 0) + 1
                overall_skills[skill] = overall_skills.get(skill, 0) + 1
                
        # Format for charts
        formatted_overall = [{"name": k, "count": v} for k, v in sorted(overall_skills.items(), key=lambda item: item[1], reverse=True)]
        
        formatted_dept = {}
        for dept, skills in dept_skills.items():
            formatted_dept[dept] = [{"name": k, "count": v} for k, v in sorted(skills.items(), key=lambda item: item[1], reverse=True)]
            
        return {
            "overall": formatted_overall,
            "by_department": formatted_dept
        }

def get_attendance_anomalies():
    """Finds employees with irregular attendance patterns."""
    with engine.connect() as conn:
        # Fetch all attendance logs joined with employees
        query = text("""
            SELECT e.employee_id, e.full_name, e.department, a.status, a.hours_worked
            FROM employees e
            JOIN attendance a ON e.id = a.employee_id
        """)
        results = conn.execute(query).fetchall()
        
        # Group by employee
        emp_stats = {}
        for row in results:
            emp_id = row[0]
            if emp_id not in emp_stats:
                emp_stats[emp_id] = {
                    "full_name": row[1],
                    "department": row[2],
                    "absent": 0,
                    "late": 0,
                    "total_hours": 0.0,
                    "days_worked": 0
                }
                
            status = row[3]
            hours = row[4]
            
            if status == "absent":
                emp_stats[emp_id]["absent"] += 1
            elif status == "late":
                emp_stats[emp_id]["late"] += 1
                
            if hours > 0:
                emp_stats[emp_id]["total_hours"] += hours
                emp_stats[emp_id]["days_worked"] += 1
                
        # Find anomalies
        anomalies = []
        for emp_id, stats in emp_stats.items():
            reasons = []
            
            if stats["absent"] > 3:
                reasons.append(f"{stats['absent']} Absences")
                
            if stats["late"] > 3:
                reasons.append(f"{stats['late']} Late Check-ins")
                
            avg_hours = stats["total_hours"] / stats["days_worked"] if stats["days_worked"] > 0 else 0
            if avg_hours > 10:
                reasons.append(f"Overworking ({avg_hours:.1f} hrs/day)")
                
            if reasons:
                anomalies.append({
                    "employee_id": emp_id,
                    "full_name": stats["full_name"],
                    "department": stats["department"],
                    "reasons": reasons
                })
                
        # Sort by most reasons
        anomalies.sort(key=lambda x: len(x["reasons"]), reverse=True)
        return anomalies
