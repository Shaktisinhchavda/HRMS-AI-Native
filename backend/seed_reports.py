"""
Seed script to generate rich test data for Natural Language Reports
"""
import json
import random
from datetime import datetime, timedelta, date

from app.database import engine, Base, SessionLocal
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.payroll import Payroll
from app.models.leave import Leave
from app.models.performance import PerformanceReview
from app.utils.logger import logger

DEPARTMENTS = ["Engineering", "Marketing", "HR", "Finance"]
DESIGNATIONS = {
    "Engineering": ["Software Engineer", "Senior Engineer", "DevOps Engineer", "QA Engineer", "Engineering Manager"],
    "Marketing": ["Marketing Specialist", "Content Writer", "SEO Analyst", "Marketing Manager"],
    "HR": ["HR Generalist", "Recruiter", "HR Manager"],
    "Finance": ["Accountant", "Financial Analyst", "Finance Manager"]
}
SKILLS_POOL = ["Python", "React", "SQL", "Excel", "AWS", "Docker", "SEO", "Communication", "Leadership"]

def get_random_skills(dept):
    if dept == "Engineering":
        pool = ["Python", "React", "SQL", "AWS", "Docker", "Go", "Java"]
    elif dept == "Marketing":
        pool = ["SEO", "Content Writing", "Google Ads", "Social Media", "Excel"]
    elif dept == "Finance":
        pool = ["Excel", "Financial Modeling", "Accounting", "SQL"]
    else:
        pool = ["Communication", "Leadership", "Recruiting", "Excel", "Conflict Resolution"]
    
    num = random.randint(2, min(5, len(pool)))
    return ", ".join(random.sample(pool, num))

def seed_database():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        logger.info("Clearing old report data...")
        db.query(Leave).delete()
        db.query(PerformanceReview).delete()
        db.query(Payroll).delete()
        db.query(Attendance).delete()
        db.query(Employee).delete()
        db.commit()

        logger.info("Seeding 100 Employees...")
        employees = []
        for i in range(1, 101): # 100 employees
            dept = random.choice(DEPARTMENTS)
            desig = random.choice(DESIGNATIONS[dept])
            base_salary = random.randint(60000, 150000) if dept == "Engineering" else random.randint(40000, 100000)
            
            hire_date = date.today() - timedelta(days=random.randint(100, 1500))
            exit_risk = random.choices(["low", "medium", "high"], weights=[0.7, 0.2, 0.1])[0]
            
            emp = Employee(
                employee_id=f"EMP{str(i).zfill(3)}",
                full_name=f"Employee {i}",
                email=f"emp{i}@hrms.local",
                department=dept,
                designation=desig,
                skills=get_random_skills(dept),
                salary=base_salary,
                hire_date=hire_date,
                exit_risk=exit_risk,
                status="active"
            )
            db.add(emp)
            employees.append(emp)
            
        db.commit()
        
        logger.info("Seeding Attendance (last 30 days)...")
        today = date.today()
        for emp in employees:
            for day_offset in range(30):
                curr_date = today - timedelta(days=day_offset)
                if curr_date.weekday() >= 5: # Weekend
                    continue
                
                status_choices = ["present", "present", "present", "wfh", "late", "absent", "half_day"]
                status = random.choice(status_choices)
                
                hours = 0
                check_in = None
                check_out = None
                
                if status in ["present", "wfh", "late"]:
                    hours = random.uniform(7.5, 9.5)
                    check_in = "09:00 AM" if status != "late" else "10:30 AM"
                    check_out = "06:00 PM"
                elif status == "half_day":
                    hours = 4.0
                    check_in = "09:00 AM"
                    check_out = "01:00 PM"
                    
                attendance = Attendance(
                    employee_id=emp.id,
                    date=curr_date,
                    status=status,
                    check_in=check_in,
                    check_out=check_out,
                    hours_worked=hours
                )
                db.add(attendance)
        
        db.commit()

        logger.info("Seeding Payroll (last 3 months)...")
        current_month = today.month
        current_year = today.year
        
        for emp in employees:
            for m_offset in range(3):
                m = current_month - m_offset - 1
                y = current_year
                if m <= 0:
                    m += 12
                    y -= 1
                    
                monthly_base = emp.salary / 12
                overtime = random.uniform(0, 500) if emp.department == "Engineering" else 0
                bonus = 1000 if m == 12 else 0 # End of year bonus
                deductions = monthly_base * 0.15 # Taxes etc
                
                net = monthly_base + overtime + bonus - deductions
                
                payroll = Payroll(
                    employee_id=emp.id,
                    month=m,
                    year=y,
                    base_salary=monthly_base,
                    overtime_pay=overtime,
                    deductions=deductions,
                    bonus=bonus,
                    net_pay=net,
                    status="paid"
                )
                db.add(payroll)
                
        db.commit()
        
        logger.info("Seeding Leaves and Performance Reviews...")
        for emp in employees:
            # Leaves: 0 to 3 leave requests per employee
            num_leaves = random.randint(0, 3)
            for _ in range(num_leaves):
                leave_start = today - timedelta(days=random.randint(10, 300))
                days = random.randint(1, 5)
                leave_end = leave_start + timedelta(days=days-1)
                
                leave = Leave(
                    employee_id=emp.id,
                    start_date=leave_start,
                    end_date=leave_end,
                    days=days,
                    status=random.choices(["approved", "pending", "rejected"], weights=[0.8, 0.1, 0.1])[0]
                )
                db.add(leave)
                
            # Performance Reviews: 1 or 2 past reviews
            num_reviews = random.randint(1, 2)
            for _ in range(num_reviews):
                review_date = today - timedelta(days=random.randint(30, 365))
                score = round(random.uniform(2.5, 5.0), 1)
                
                if emp.exit_risk == "high":
                    score = round(random.uniform(1.0, 3.0), 1) # lower scores for high risk
                elif emp.exit_risk == "low":
                    score = round(random.uniform(3.5, 5.0), 1)
                
                review = PerformanceReview(
                    employee_id=emp.id,
                    score=score,
                    review_date=review_date,
                    comments="Mocked review from seeding script."
                )
                db.add(review)
                
        db.commit()

        logger.info("Reports seed data generation complete! [OK]")
        
    except Exception as e:
        logger.error(f"Seed failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
