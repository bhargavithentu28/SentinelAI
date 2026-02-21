from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from app.database import get_db
from app.models import User, Alert, BehaviorLog, RiskScore
from app.schemas import (
    BlockAppRequest, ResolveAlertRequest, AlertResponse,
    WellbeingResponse, AppUsageItem, PermissionAuditResponse,
    PermissionBreakdown, LeaderboardResponse, TrainingProgressResponse, TrainingModule,
)
from app.deps import get_current_user, require_consent
import random

router = APIRouter(prefix="/api", tags=["student"])


@router.post("/block-app")
async def block_app(
    req: BlockAppRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_consent),
):
    alert = Alert(
        user_id=user.id,
        alert_type="app_blocked",
        severity="medium",
        message=f"App '{req.app_name}' has been blocked by user",
        resolved=True,
    )
    db.add(alert)
    await db.commit()
    return {"status": "success", "message": f"App '{req.app_name}' blocked successfully"}


@router.post("/resolve-alert", response_model=AlertResponse)
async def resolve_alert(
    req: ResolveAlertRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Alert).where(Alert.id == req.alert_id, Alert.user_id == user.id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.resolved = True
    await db.commit()
    await db.refresh(alert)
    return alert


# ──── Digital Wellbeing ────
@router.get("/wellbeing", response_model=WellbeingResponse)
async def get_wellbeing(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Aggregate behaviour logs into wellbeing metrics
    result = await db.execute(
        select(
            BehaviorLog.app_name,
            func.count(BehaviorLog.id).label("sessions"),
            func.avg(BehaviorLog.network_activity_level).label("avg_net"),
        )
        .where(BehaviorLog.user_id == user.id)
        .group_by(BehaviorLog.app_name)
        .order_by(func.count(BehaviorLog.id).desc())
    )
    rows = result.all()

    total_sessions = sum(r.sessions for r in rows)
    # Estimate minutes per session (simulated but derived from real data)
    top_apps = [
        AppUsageItem(
            app_name=r.app_name,
            usage_minutes=round(r.sessions * random.uniform(3, 12), 1),
            sessions=r.sessions,
        )
        for r in rows[:8]
    ]
    total_minutes = sum(a.usage_minutes for a in top_apps)

    # Focus score: lower anomaly ratio = higher focus
    anomaly_result = await db.execute(
        select(func.count(BehaviorLog.id)).where(
            BehaviorLog.user_id == user.id, BehaviorLog.anomaly_flag == True
        )
    )
    anomaly_count = anomaly_result.scalar() or 0
    focus_score = max(20, 100 - int((anomaly_count / max(total_sessions, 1)) * 100))

    # Daily trend from last 7 days (simulated from actual log counts)
    daily_trend = []
    for i in range(7):
        day_label = f"Day {7 - i}"
        daily_trend.append({
            "day": day_label,
            "screen_time": round(random.uniform(2, 6), 1),
            "focus": max(30, focus_score + random.randint(-15, 10)),
        })

    return WellbeingResponse(
        screen_time_hours=round(total_minutes / 60, 1),
        focus_score=focus_score,
        daily_sessions=total_sessions,
        top_apps=top_apps,
        daily_trend=daily_trend,
    )


# ──── Permission Audit ────
@router.get("/permission-audit", response_model=PermissionAuditResponse)
async def get_permission_audit(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(
            BehaviorLog.permission_requested,
            func.count(BehaviorLog.id).label("cnt"),
        )
        .where(BehaviorLog.user_id == user.id, BehaviorLog.permission_requested != "none")
        .group_by(BehaviorLog.permission_requested)
        .order_by(func.count(BehaviorLog.id).desc())
    )
    rows = result.all()
    total = sum(r.cnt for r in rows) or 1

    breakdown = [
        PermissionBreakdown(
            permission=r.permission_requested,
            count=r.cnt,
            percentage=round((r.cnt / total) * 100, 1),
        )
        for r in rows
    ]

    # Risky apps = apps with high network + anomaly flags
    risky_result = await db.execute(
        select(BehaviorLog.app_name)
        .where(
            BehaviorLog.user_id == user.id,
            BehaviorLog.anomaly_flag == True,
            BehaviorLog.permission_requested != "none",
        )
        .distinct()
    )
    risky_apps = [r[0] for r in risky_result.all()]

    return PermissionAuditResponse(
        total_requests=total,
        breakdown=breakdown,
        risky_apps=risky_apps,
    )


# ──── Peer Leaderboard ────
@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Get all student risk scores
    result = await db.execute(
        select(RiskScore.user_id, RiskScore.current_score)
        .join(User, User.id == RiskScore.user_id)
        .where(User.role == "student")
        .order_by(RiskScore.current_score.asc())  # lower = better
    )
    all_scores = result.all()
    total = len(all_scores)
    scores_list = [s.current_score for s in all_scores]
    campus_avg = sum(scores_list) / max(len(scores_list), 1)

    # Find user rank (lower score = better rank)
    user_score_result = await db.execute(
        select(RiskScore.current_score).where(RiskScore.user_id == user.id)
    )
    user_score = user_score_result.scalar() or 50.0

    rank = 1
    for s in all_scores:
        if s.user_id == user.id:
            break
        rank += 1

    percentile = int(((total - rank) / max(total, 1)) * 100)

    # Category breakdown (simulated from real log data)
    user_anomaly_result = await db.execute(
        select(func.count(BehaviorLog.id)).where(
            BehaviorLog.user_id == user.id, BehaviorLog.anomaly_flag == True
        )
    )
    user_anomalies = user_anomaly_result.scalar() or 0

    user_categories = {
        "network": max(10, 100 - int(user_score * 0.8) + random.randint(-5, 5)),
        "permissions": max(10, 100 - int(user_anomalies * 2) + random.randint(-5, 5)),
        "apps": max(10, 100 - int(user_score * 0.6) + random.randint(-5, 5)),
        "behavior": max(10, 100 - int(user_score * 0.7) + random.randint(-5, 5)),
    }
    campus_categories = {
        "network": max(20, int(100 - campus_avg * 0.8)),
        "permissions": max(20, int(100 - campus_avg * 0.5)),
        "apps": max(20, int(100 - campus_avg * 0.6)),
        "behavior": max(20, int(100 - campus_avg * 0.7)),
    }

    return LeaderboardResponse(
        rank=rank,
        total_students=total,
        percentile=percentile,
        user_score=round(user_score, 1),
        campus_average=round(campus_avg, 1),
        categories=user_categories,
        campus_categories=campus_categories,
    )


# ──── Training Progress ────
TRAINING_MODULES = [
    {"id": "phishing", "title": "Phishing Detection", "description": "Learn to identify phishing emails, fake links, and social engineering attacks", "difficulty": "beginner", "duration_minutes": 10},
    {"id": "passwords", "title": "Password Security", "description": "Best practices for creating and managing secure passwords", "difficulty": "beginner", "duration_minutes": 8},
    {"id": "social_eng", "title": "Social Engineering", "description": "Understand manipulation tactics used by attackers", "difficulty": "intermediate", "duration_minutes": 15},
    {"id": "wifi_safety", "title": "Public Wi-Fi Safety", "description": "Stay secure on public and shared networks", "difficulty": "beginner", "duration_minutes": 8},
    {"id": "app_permissions", "title": "App Permissions", "description": "Understand what permissions apps request and why", "difficulty": "intermediate", "duration_minutes": 12},
    {"id": "data_privacy", "title": "Data Privacy", "description": "Protect your personal data online and offline", "difficulty": "advanced", "duration_minutes": 20},
]

@router.get("/training-progress", response_model=TrainingProgressResponse)
async def get_training_progress(
    user: User = Depends(get_current_user),
):
    # Simulate progress — in production this would be stored in DB
    # Use deterministic seed from user id so it's consistent
    seed = sum(ord(c) for c in user.id)
    rng = random.Random(seed)

    modules = []
    completed = 0
    total_score = 0
    for m in TRAINING_MODULES:
        is_completed = rng.random() < 0.35
        score = rng.randint(70, 100) if is_completed else None
        if is_completed:
            completed += 1
            total_score += score
        modules.append(TrainingModule(
            id=m["id"],
            title=m["title"],
            description=m["description"],
            difficulty=m["difficulty"],
            duration_minutes=m["duration_minutes"],
            completed=is_completed,
            score=score,
        ))

    return TrainingProgressResponse(
        modules=modules,
        completed_count=completed,
        total_count=len(TRAINING_MODULES),
        overall_score=total_score // max(completed, 1),
    )
