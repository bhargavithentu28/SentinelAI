"""Seed data script: creates demo admin + student users with sample data."""
import asyncio
from datetime import datetime, timezone, timedelta
import random
from app.database import engine, async_session, Base
from app.models import User, RiskScore, Alert, BehaviorLog
from app.auth import hash_password


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        from sqlalchemy import select, func
        count = await db.execute(select(func.count(User.id)))
        if (count.scalar() or 0) > 0:
            print("Database already has data. Skipping seed.")
            return

        # Create admin
        admin = User(
            name="Admin User",
            email="admin@sentinelai.com",
            college="SentinelAI HQ",
            role="admin",
            hashed_password=hash_password("admin123"),
            consent_given=True,
        )
        db.add(admin)

        # Create demo students
        students = []
        for i in range(5):
            student = User(
                name=f"Student {i+1}",
                email=f"student{i+1}@university.edu",
                college="Demo University",
                role="student",
                hashed_password=hash_password("student123"),
                consent_given=True,
            )
            db.add(student)
            students.append(student)

        await db.flush()

        apps = ["WhatsApp", "Instagram", "Chrome", "TikTok", "YouTube",
                "SuspiciousVPN", "UnknownAPK", "CryptoMiner"]

        for student in students:
            score = round(random.uniform(10, 90), 1)
            level = "low" if score <= 40 else ("medium" if score <= 70 else "high")
            rs = RiskScore(user_id=student.id, current_score=score, risk_level=level)
            db.add(rs)

            for j in range(20):
                is_anomaly = random.random() < 0.25
                log = BehaviorLog(
                    user_id=student.id,
                    timestamp=datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 48)),
                    app_name=random.choice(apps),
                    permission_requested=random.choice(["none", "camera", "location", "storage"]),
                    network_activity_level=round(random.uniform(50, 95) if is_anomaly else random.uniform(5, 35), 1),
                    background_process_flag=is_anomaly,
                    anomaly_flag=is_anomaly,
                )
                db.add(log)

            if score > 70:
                for k in range(3):
                    alert = Alert(
                        user_id=student.id,
                        alert_type="high_risk_behavior",
                        severity=random.choice(["high", "critical"]),
                        message="Suspicious activity detected: elevated network usage and background processes",
                        created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 24)),
                        resolved=random.choice([True, False]),
                    )
                    db.add(alert)

        db.add(RiskScore(user_id=admin.id, current_score=0.0, risk_level="low"))

        await db.commit()
        print("Seed data created successfully!")
        print("  Admin: admin@sentinelai.com / admin123")
        print("  Students: student1@university.edu ... student5@university.edu / student123")


if __name__ == "__main__":
    asyncio.run(seed())
