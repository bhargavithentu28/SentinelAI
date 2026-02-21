from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case, and_
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime, timezone, timedelta
import csv
import io

from app.database import get_db
from app.models import User, RiskScore, Alert, BehaviorLog
from app.schemas import (
    AdminStatsResponse, HighRiskUserResponse,
    ActivityFeedItem, TrendPoint, CollegeBreakdownItem, UserListItem,
)
from app.deps import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    total_result = await db.execute(select(func.count(User.id)))
    total_users = total_result.scalar() or 0

    students_result = await db.execute(
        select(func.count(User.id)).where(User.role == "student")
    )
    total_students = students_result.scalar() or 0

    admins_result = await db.execute(
        select(func.count(User.id)).where(User.role == "admin")
    )
    total_admins = admins_result.scalar() or 0

    high_result = await db.execute(
        select(func.count(RiskScore.id)).where(RiskScore.risk_level == "high")
    )
    high_risk = high_result.scalar() or 0

    medium_result = await db.execute(
        select(func.count(RiskScore.id)).where(RiskScore.risk_level == "medium")
    )
    medium_risk = medium_result.scalar() or 0

    low_result = await db.execute(
        select(func.count(RiskScore.id)).where(RiskScore.risk_level == "low")
    )
    low_risk = low_result.scalar() or 0

    alerts_result = await db.execute(select(func.count(Alert.id)))
    total_alerts = alerts_result.scalar() or 0

    unresolved_result = await db.execute(
        select(func.count(Alert.id)).where(Alert.resolved == False)
    )
    unresolved_alerts = unresolved_result.scalar() or 0

    return AdminStatsResponse(
        total_users=total_users,
        total_students=total_students,
        total_admins=total_admins,
        high_risk_count=high_risk,
        medium_risk_count=medium_risk,
        low_risk_count=low_risk,
        total_alerts=total_alerts,
        unresolved_alerts=unresolved_alerts,
        risk_distribution={"high": high_risk, "medium": medium_risk, "low": low_risk},
    )


@router.get("/high-risk-users", response_model=List[HighRiskUserResponse])
async def get_high_risk_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(User, RiskScore)
        .join(RiskScore, User.id == RiskScore.user_id)
        .where(RiskScore.current_score > 70)
        .order_by(RiskScore.current_score.desc())
    )
    rows = result.all()
    return [
        HighRiskUserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            college=user.college,
            current_score=risk.current_score,
            risk_level=risk.risk_level,
        )
        for user, risk in rows
    ]


@router.get("/export-report")
async def export_report(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(User, RiskScore)
        .join(RiskScore, User.id == RiskScore.user_id)
        .order_by(RiskScore.current_score.desc())
    )
    rows = result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Email", "College", "Role", "Risk Score", "Risk Level"])
    for user, risk in rows:
        writer.writerow([
            user.name, user.email, user.college, user.role,
            risk.current_score, risk.risk_level,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sentinel_report.csv"},
    )


# ──── Activity Feed ────
@router.get("/activity-feed", response_model=List[ActivityFeedItem])
async def get_activity_feed(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
    limit: int = Query(50, le=100),
):
    result = await db.execute(
        select(Alert, User.name, User.email)
        .join(User, User.id == Alert.user_id)
        .order_by(Alert.created_at.desc())
        .limit(limit)
    )
    rows = result.all()
    return [
        ActivityFeedItem(
            id=alert.id,
            student_name=name,
            student_email=email,
            alert_type=alert.alert_type,
            severity=alert.severity,
            message=alert.message,
            created_at=alert.created_at,
        )
        for alert, name, email in rows
    ]


# ──── Trend Analytics ────
@router.get("/trends", response_model=List[TrendPoint])
async def get_trends(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
    days: int = Query(14, le=30),
):
    trends = []
    now = datetime.now(timezone.utc)

    for i in range(days, 0, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        # Average risk score across all students
        score_result = await db.execute(
            select(func.avg(RiskScore.current_score))
        )
        avg_score = score_result.scalar() or 0

        # Alerts created that day
        alert_result = await db.execute(
            select(func.count(Alert.id)).where(
                and_(Alert.created_at >= day_start, Alert.created_at < day_end)
            )
        )
        alert_count = alert_result.scalar() or 0

        # Anomalies that day
        anomaly_result = await db.execute(
            select(func.count(BehaviorLog.id)).where(
                and_(
                    BehaviorLog.timestamp >= day_start,
                    BehaviorLog.timestamp < day_end,
                    BehaviorLog.anomaly_flag == True,
                )
            )
        )
        anomaly_count = anomaly_result.scalar() or 0

        trends.append(TrendPoint(
            date=day_start.strftime("%b %d"),
            avg_risk_score=round(float(avg_score), 1),
            alert_count=alert_count,
            anomaly_count=anomaly_count,
        ))

    return trends


# ──── College Breakdown ────
@router.get("/college-breakdown", response_model=List[CollegeBreakdownItem])
async def get_college_breakdown(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    # Get all students with their risk scores grouped by college
    result = await db.execute(
        select(
            User.college,
            func.count(User.id).label("total"),
            func.sum(case((RiskScore.risk_level == "high", 1), else_=0)).label("high"),
            func.sum(case((RiskScore.risk_level == "medium", 1), else_=0)).label("medium"),
            func.sum(case((RiskScore.risk_level == "low", 1), else_=0)).label("low"),
            func.avg(RiskScore.current_score).label("avg_score"),
        )
        .join(RiskScore, User.id == RiskScore.user_id)
        .where(User.role == "student")
        .group_by(User.college)
        .order_by(func.avg(RiskScore.current_score).desc())
    )
    rows = result.all()
    return [
        CollegeBreakdownItem(
            college=r.college,
            total_students=r.total,
            high_risk=r.high or 0,
            medium_risk=r.medium or 0,
            low_risk=r.low or 0,
            avg_score=round(float(r.avg_score or 0), 1),
        )
        for r in rows
    ]


# ──── All Users ────
@router.get("/all-users", response_model=List[UserListItem])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
    search: str = Query("", description="Search by name or email"),
    role_filter: str = Query("all", description="Filter by role"),
):
    query = (
        select(User, RiskScore.current_score, RiskScore.risk_level)
        .outerjoin(RiskScore, User.id == RiskScore.user_id)
    )

    if search:
        query = query.where(
            User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    if role_filter != "all":
        query = query.where(User.role == role_filter)

    query = query.order_by(User.created_at.desc())
    result = await db.execute(query)
    rows = result.all()

    items = []
    for user, score, level in rows:
        # Count alerts for user
        alert_result = await db.execute(
            select(func.count(Alert.id)).where(Alert.user_id == user.id)
        )
        alert_count = alert_result.scalar() or 0

        items.append(UserListItem(
            id=user.id,
            name=user.name,
            email=user.email,
            college=user.college,
            role=user.role,
            consent_given=user.consent_given,
            risk_score=round(float(score), 1) if score else None,
            risk_level=level,
            alert_count=alert_count,
            created_at=user.created_at,
        ))

    return items
