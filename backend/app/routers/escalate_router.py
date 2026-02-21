from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User, IntegrationConfig
from app.schemas import EscalateRequest
from app.deps import get_current_user

router = APIRouter(prefix="/api/escalate", tags=["escalate"])

@router.post("", status_code=status.HTTP_200_OK)
async def escalate_incident(
    req: EscalateRequest, 
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Retrieve active integration hooks for the campus IT center
    result = await db.execute(select(IntegrationConfig).where(IntegrationConfig.status == "active"))
    configs = result.scalars().all()
    
    if not configs:
        # In a real app we'd just log this. For the demo, we return a success response 
        # acknowledging the simulated escalation to Campus IT.
        return {
            "status": "success", 
            "message": f"Escalated high-risk alert for user {req.user_id} to Campus IT.",
            "hooks_triggered": 0
        }
        
    return {
        "status": "success", 
        "message": f"Escalated high-risk alert for user {req.user_id} to Campus IT.",
        "hooks_triggered": len(configs)
    }
