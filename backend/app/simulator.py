import random
import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import async_session
from app.models import User, BehaviorLog, RiskScore, Alert, Device, BehaviorProfile, DataAccessLog
from app.ai_engine import calculate_risk
from app.websocket_manager import manager
from sqlalchemy import select

logger = logging.getLogger(__name__)

APPS = [
    "WhatsApp", "Instagram", "Chrome", "TikTok", "Snapchat",
    "YouTube", "Telegram", "Facebook", "Calculator", "Camera",
    "Files", "Settings", "Maps", "Gmail", "Slack",
    "SuspiciousVPN", "UnknownAPK", "CryptoMiner", "KeyLogger",
]

PERMISSIONS = [
    "none", "camera", "microphone", "location", "contacts",
    "storage", "sms", "phone", "accessibility", "overlay",
]

SUSPICIOUS_APPS = {"SuspiciousVPN", "UnknownAPK", "CryptoMiner", "KeyLogger"}


def generate_log(anomaly_chance: float = 0.2) -> dict:
    is_anomaly = random.random() < anomaly_chance
    app = random.choice(list(SUSPICIOUS_APPS)) if is_anomaly else random.choice(APPS[:15])

    return {
        "app_name": app,
        "permission_requested": random.choice(PERMISSIONS[1:]) if is_anomaly or random.random() < 0.3 else "none",
        "network_activity_level": round(random.uniform(60, 100), 1) if is_anomaly else round(random.uniform(0, 40), 1),
        "background_process_flag": is_anomaly or random.random() < 0.1,
        "anomaly_flag": is_anomaly,
    }


async def simulate_for_device(db: AsyncSession, user_id: str, device_id: str, anomaly_chance: float = 0.2):
    log_data = generate_log(anomaly_chance)

    log_entry = BehaviorLog(
        user_id=user_id,
        device_id=device_id,
        app_name=log_data["app_name"],
        permission_requested=log_data["permission_requested"],
        network_activity_level=log_data["network_activity_level"],
        background_process_flag=log_data["background_process_flag"],
        anomaly_flag=log_data["anomaly_flag"],
        log_data=log_data,
    )
    db.add(log_entry)
    await db.flush()

    # Privacy Transparency: Log data access for simulator AI check
    db.add(DataAccessLog(
        user_id=user_id, 
        data_type="Device Telemetry", 
        purpose="Automated Background Anomaly Detection"
    ))

    # Fetch User Baseline
    bp_result = await db.execute(select(BehaviorProfile).where(BehaviorProfile.user_id == user_id))
    profile = bp_result.scalar_one_or_none()
    baseline = profile.baseline_metrics if profile else None

    # Get recent logs
    result = await db.execute(
        select(BehaviorLog)
        .where(BehaviorLog.user_id == user_id)
        .order_by(BehaviorLog.timestamp.desc())
        .limit(50)
    )
    recent_logs = result.scalars().all()
    logs_dicts = [
        {
            "permission_requested": l.permission_requested,
            "network_activity_level": l.network_activity_level,
            "background_process_flag": l.background_process_flag,
            "anomaly_flag": l.anomaly_flag,
        }
        for l in recent_logs
    ]

    risk = calculate_risk(logs_dicts, baseline=baseline)
    score = risk["score"]
    level = risk["level"]
    explanation = risk.get("explanation", "")
    recommendation = risk.get("recommendation", "")
    severity = risk.get("severity", "high")

    rs_result = await db.execute(
        select(RiskScore).where(RiskScore.user_id == user_id)
    )
    risk_score = rs_result.scalar_one_or_none()
    if risk_score:
        risk_score.current_score = score
        risk_score.risk_level = level
        risk_score.last_updated = datetime.now(timezone.utc)
    else:
        risk_score = RiskScore(user_id=user_id, current_score=score, risk_level=level)
        db.add(risk_score)

    if score > 70:
        alert = Alert(
            user_id=user_id,
            alert_type="high_risk_behavior",
            severity=severity,
            message=f"Risk score {score}: suspicious activity from {log_data['app_name']}",
            explanation_text=explanation or f"Anomalous app behavior in {log_data['app_name']}",
            recommendation=recommendation or "Review device activity.",
            confidence_score=0.9
        )
        db.add(alert)
        await db.flush()

        await manager.send_to_user(str(user_id), {
            "type": "alert",
            "alert_id": alert.id,
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "message": alert.message,
            "recommendation": alert.recommendation,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "risk_score": score,
        })

    await db.commit()


async def run_simulator(interval: int = 30):
    logger.info(f"Device simulator started (interval={interval}s)")
    while True:
        try:
            async with async_session() as db:
                result = await db.execute(
                    select(User).where(
                        User.role == "student",
                        User.consent_given == True,
                    )
                )
                students = result.scalars().all()

                devices_simulated = 0
                for student in students:
                    anomaly_chance = random.uniform(0.1, 0.35)
                    
                    # Fetch devices
                    dev_res = await db.execute(select(Device).where(Device.user_id == student.id))
                    devices = dev_res.scalars().all()
                    
                    if not devices:
                        # Auto register default device if none exist
                        main_device = Device(user_id=student.id, device_name="Main Phone", device_type="smartphone")
                        db.add(main_device)
                        await db.commit()
                        await db.refresh(main_device)
                        devices = [main_device]
                        
                    for d in devices:
                        await simulate_for_device(db, student.id, d.id, anomaly_chance)
                        devices_simulated += 1

                if devices_simulated > 0:
                    logger.info(f"Simulated logs for {devices_simulated} devices across {len(students)} students")

        except Exception as e:
            logger.error(f"Simulator error: {e}")

        await asyncio.sleep(interval)
