from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import List
from app.database import get_db
from app.models import User, BehaviorLog, RiskScore, Alert, BehaviorProfile, DataAccessLog
from app.schemas import LogIngestRequest, LogResponse, RiskScoreResponse, AlertResponse
from app.deps import get_current_user, require_consent
from app.ai_engine import calculate_risk
from app.websocket_manager import manager

router = APIRouter(prefix="/api", tags=["logs"])


@router.post("/logs", response_model=LogResponse)
async def ingest_log(
    req: LogIngestRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_consent),
):
    log_entry = BehaviorLog(
        user_id=user.id,
        device_id=req.device_id,
        app_name=req.app_name,
        permission_requested=req.permission_requested,
        network_activity_level=req.network_activity_level,
        background_process_flag=req.background_process_flag,
        anomaly_flag=req.anomaly_flag,
        log_data=req.extra_data or {},
    )
    db.add(log_entry)
    await db.flush()

    # Recalculate risk score
    result = await db.execute(
        select(BehaviorLog)
        .where(BehaviorLog.user_id == user.id)
        .order_by(BehaviorLog.timestamp.desc())
        .limit(50)
    )
    recent = result.scalars().all()
    logs_data = [
        {
            "permission_requested": l.permission_requested,
            "network_activity_level": l.network_activity_level,
            "background_process_flag": l.background_process_flag,
            "anomaly_flag": l.anomaly_flag,
        }
        for l in recent
    ]

    # Privacy Transparency: Log data access for AI calculation
    db.add(DataAccessLog(
        user_id=user.id, 
        data_type="Behavioral History", 
        purpose="AI Risk Score Calculation and Deviation Check"
    ))

    # Fetch User Baseline
    bp_result = await db.execute(select(BehaviorProfile).where(BehaviorProfile.user_id == user.id))
    profile = bp_result.scalar_one_or_none()
    baseline = profile.baseline_metrics if profile else None

    # Calculate Risk using personalized baseline logic
    risk = calculate_risk(logs_data, baseline=baseline)

    # Update risk score
    rs_result = await db.execute(select(RiskScore).where(RiskScore.user_id == user.id))
    risk_score = rs_result.scalar_one_or_none()
    if risk_score:
        risk_score.current_score = risk["score"]
        risk_score.risk_level = risk["level"]
        risk_score.last_updated = datetime.now(timezone.utc)
    else:
        risk_score = RiskScore(
            user_id=user.id, current_score=risk["score"], risk_level=risk["level"]
        )
        db.add(risk_score)

    # Alert if high risk
    if risk["score"] > 70:
        alert = Alert(
            user_id=user.id,
            alert_type="high_risk_behavior",
            severity=risk.get("severity", "high"),
            message=f"Risk score {risk['score']}: suspicious activity from {req.app_name}",
            explanation_text=risk.get("explanation", f"High risk score detected from excessive permissions or background activity in {req.app_name}."),
            recommendation=risk.get("recommendation", "Review the app's requested permissions and consider blocking or uninstalling it."),
            confidence_score=0.95
        )
        db.add(alert)
        await db.flush()

        await manager.send_to_user(str(user.id), {
            "type": "alert",
            "alert_id": alert.id,
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "message": alert.message,
            "recommendation": alert.recommendation,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "risk_score": risk["score"],
        })

    await db.commit()
    await db.refresh(log_entry)
    return log_entry


@router.get("/risk-score", response_model=RiskScoreResponse)
async def get_risk_score(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(RiskScore).where(RiskScore.user_id == user.id))
    risk_score = result.scalar_one_or_none()
    if not risk_score:
        return RiskScoreResponse(current_score=0.0, risk_level="low", last_updated=None)
    return risk_score


@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Alert)
        .where(Alert.user_id == user.id)
        .order_by(Alert.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


@router.get("/logs/recent", response_model=List[LogResponse])
async def get_recent_logs(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_consent),
):
    result = await db.execute(
        select(BehaviorLog)
        .where(BehaviorLog.user_id == user.id)
        .order_by(BehaviorLog.timestamp.desc())
        .limit(30)
    )
    return result.scalars().all()
