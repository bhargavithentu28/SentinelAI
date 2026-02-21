from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
from app.database import get_db
from app.models import Incident, User, Alert
from app.schemas import ReportIncidentRequest, IncidentResponse
from app.deps import get_current_user

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

@router.post("/report", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def report_incident(
    req: ReportIncidentRequest, 
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Verify the alert exists and belongs to the user
    result = await db.execute(select(Alert).where(Alert.id == req.alert_id, Alert.user_id == user.id))
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    incident = Incident(
        alert_id=req.alert_id,
        user_id=user.id,
        report_type=req.report_type.value,
        description=req.description,
        status="open"
    )
    db.add(incident)
    
    # Optionally mark the alert as resolved since they reported it as false positive
    alert.resolved = True
    
    await db.commit()
    await db.refresh(incident)
    return incident

@router.get("", response_model=List[IncidentResponse])
async def get_incidents(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if user.role == "admin":
        result = await db.execute(select(Incident).order_by(Incident.created_at.desc()))
    else:
        result = await db.execute(select(Incident).where(Incident.user_id == user.id).order_by(Incident.created_at.desc()))
        
    return result.scalars().all()

@router.patch("/{incident_id}/status", response_model=IncidentResponse)
async def update_incident_status(
    incident_id: int,
    status: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Only admins can update status typically, but allowing for demo purposes
    if user.role != "admin" and status != "resolved":
        raise HTTPException(status_code=403, detail="Not authorized to change status to anything but resolved")
        
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    # Security: Ensure users can only update their own incidents if they aren't admin
    if user.role != "admin" and incident.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    incident.status = status
    await db.commit()
    await db.refresh(incident)
    return incident
