from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from datetime import datetime, timedelta, timezone
from app.database import get_db
from app.models import BehaviorLog, User
from app.schemas import TimelinePoint, HeatmapPoint
from app.deps import get_current_user
import random

router = APIRouter(prefix="/api/anomalies", tags=["anomalies"])

@router.get("/timeline", response_model=List[TimelinePoint])
async def get_anomaly_timeline(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # For a real implementation, we'd group logs by hour/minute and average the score.
    # Since sqlite/asyncpg date math varies, we'll fetch the last 24 hours of logs
    # and organize them in python, or simply mock a timeline if few logs exist.
    
    time_limit = datetime.utcnow() - timedelta(hours=24)
    result = await db.execute(
        select(BehaviorLog.timestamp, BehaviorLog.anomaly_score)
        .where(BehaviorLog.user_id == user.id, BehaviorLog.timestamp >= time_limit)
        .order_by(BehaviorLog.timestamp.asc())
    )
    
    logs = result.all()
    
    if len(logs) < 10:
        # Generate stable mock data for the demo if insufficient logs
        base_time = datetime.utcnow() - timedelta(hours=12)
        mock_timeline = []
        for i in range(12):
            point_time = base_time + timedelta(hours=i)
            mock_timeline.append(TimelinePoint(
                timestamp=point_time.strftime("%H:%M"),
                risk_score=random.uniform(10.0, 45.0) if i != 8 else random.uniform(80.0, 95.0) # spike at hour 8
            ))
        return mock_timeline
        
    # Group by hour
    grouped = {}
    for timestamp, score in logs:
        hour_key = timestamp.strftime("%H:00")
        if hour_key not in grouped:
            grouped[hour_key] = []
        grouped[hour_key].append(score or 0.0)
        
    timeline = []
    for hour, scores in grouped.items():
        avg_score = sum(scores) / len(scores)
        timeline.append(TimelinePoint(timestamp=hour, risk_score=round(avg_score, 1)))
        
    return timeline

@router.get("/heatmap", response_model=List[HeatmapPoint])
async def get_anomaly_heatmap(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Heatmap of hour of day vs frequency of high-risk anomalies
    # Returning a simulated heatmap pattern for the dashboard
    
    heatmap = []
    # 24 hours
    for h in range(24):
        # Higher frequency during night hours (simulated anomaly pattern)
        if 1 <= h <= 4:
            freq = random.randint(5, 15)
        elif 9 <= h <= 17:
            freq = random.randint(0, 3)
        else:
            freq = random.randint(0, 5)
            
        heatmap.append(HeatmapPoint(hour=h, frequency=freq))
        
    return heatmap
