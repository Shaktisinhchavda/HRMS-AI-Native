"""
Seed script — Creates initial admin and sample users
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.services.auth import hash_password
from app.utils.logger import logger


def seed_database():
    """Create initial users in the database."""
    # Ensure tables exist
    os.makedirs("logs", exist_ok=True)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == "admin@hrms.local").first()
        if existing_admin:
            logger.info("Seed data already exists. Skipping.")
            print("[OK] Seed data already exists. Skipping.")
            return

        # Create admin user
        admin = User(
            email="admin@hrms.local",
            hashed_password=hash_password("admin123"),
            full_name="System Administrator",
            role=UserRole.ADMIN,
            department="IT",
            designation="System Admin",
        )
        db.add(admin)

        # Create HR Manager
        hr_manager = User(
            email="hr@hrms.local",
            hashed_password=hash_password("hr123"),
            full_name="Priya Sharma",
            role=UserRole.HR_MANAGER,
            department="Human Resources",
            designation="HR Manager",
        )
        db.add(hr_manager)

        # Create sample employee
        employee = User(
            email="employee@hrms.local",
            hashed_password=hash_password("emp123"),
            full_name="Rahul Verma",
            role=UserRole.EMPLOYEE,
            department="Engineering",
            designation="Software Engineer",
        )
        db.add(employee)

        db.commit()
        logger.info("Database seeded successfully with 3 users")
        print("[OK] Database seeded successfully!")
        print("  - admin@hrms.local / admin123 (Admin)")
        print("  - hr@hrms.local / hr123 (HR Manager)")
        print("  - employee@hrms.local / emp123 (Employee)")

    except Exception as e:
        db.rollback()
        logger.error(f"Seed failed: {e}")
        print(f"[FAIL] Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
