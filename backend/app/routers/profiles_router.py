from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User, BehaviorProfile
from app.schemas import BehaviorProfileResponse
from app.deps import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])

@router.get("/baseline", response_model=BehaviorProfileResponse)
async def get_baseline(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(select(BehaviorProfile).where(BehaviorProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    
    if not profile:
        # Return an empty/default profile if none exists yet
        return {"user_id": user.id, "baseline_metrics": {}, "last_updated": user.created_at}
        
    return profile

@router.get("/deviation")
async def get_deviation(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # This endpoint returns the user's current deviation from their baseline.
    # In a real app we'd calculate this on the fly or fetch from a recent cache.
    result = await db.execute(select(BehaviorProfile).where(BehaviorProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    
    if not profile or not profile.baseline_metrics:
        return {"deviation_score": 0.0, "status": "no_baseline"}
        
    # Return a mocked deviation score for visualization
    import random
    score = random.uniform(0.0, 100.0)
    return {
        "deviation_score": round(score, 1), 
        "status": "normal" if score < 70 else "abnormal"
    }
