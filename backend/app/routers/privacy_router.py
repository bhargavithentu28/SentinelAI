from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models import DataAccessLog, User, Alert
from app.schemas import DataAccessLogResponse
from app.deps import get_current_user

router = APIRouter(prefix="/api/privacy", tags=["privacy"])

@router.get("/data-access", response_model=List[DataAccessLogResponse])
async def get_data_access_logs(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Retrieve the audit trail of what data the system accessed for this user
    result = await db.execute(select(DataAccessLog).where(DataAccessLog.user_id == user.id).order_by(DataAccessLog.timestamp.desc()))
    return result.scalars().all()

@router.get("/explanation/{alert_id}")
async def get_alert_explanation(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Explainability Engine Endpoint: Explains an alert in natural language
    result = await db.execute(select(Alert).where(Alert.id == alert_id, Alert.user_id == user.id))
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    return {
        "alert_id": alert.id,
        "explanation": alert.explanation_text or "No detailed explanation available for this alert.",
        "recommendation": alert.recommendation or "Review the activity manually.",
        "confidence_score": alert.confidence_score
    }
