from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User, RiskScore
from app.schemas import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse, ConsentRequest
)
from app.auth import hash_password, verify_password, create_access_token, create_refresh_token
from app.deps import get_current_user

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=req.name,
        email=req.email,
        college=req.college,
        role=req.role.value,
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    await db.flush()

    risk_score = RiskScore(user_id=user.id, current_score=0.0, risk_level="low")
    db.add(risk_score)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.get("/profile", response_model=UserResponse)
async def get_profile(user: User = Depends(get_current_user)):
    return user


@router.post("/consent", response_model=UserResponse)
async def give_consent(
    req: ConsentRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not req.accept_terms or not req.enable_monitoring:
        raise HTTPException(status_code=400, detail="You must accept terms and enable monitoring")

    user.consent_given = True
    await db.commit()
    await db.refresh(user)
    return user
