from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models import Device, User
from app.schemas import RegisterDeviceRequest, DeviceResponse
from app.deps import get_current_user

router = APIRouter(prefix="/api/devices", tags=["devices"])

@router.post("/register", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def register_device(
    req: RegisterDeviceRequest, 
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    device = Device(
        user_id=user.id,
        device_name=req.device_name,
        device_type=req.device_type,
        risk_score=0.0
    )
    db.add(device)
    await db.commit()
    await db.refresh(device)
    return device

@router.get("", response_model=List[DeviceResponse])
async def get_devices(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(select(Device).where(Device.user_id == user.id))
    devices = result.scalars().all()
    return devices

@router.get("/{device_id}/risk", response_model=float)
async def get_device_risk(
    device_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.user_id == user.id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return device.risk_score
