import asyncio
import logging
import os
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.database import create_tables
from app.websocket_manager import manager
from app.routers import (
    auth_router, logs_router, student_router, admin_router,
    devices_router, profiles_router, incidents_router, privacy_router,
    escalate_router, anomalies_router
)
settings = get_settings()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT])

simulator_task = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global simulator_task
    logger.info("SentinelAI starting up...")
    await create_tables()
    logger.info("Database tables created")

    # Auto-seed demo data if database is empty
    try:
        from app.database import async_session
        from app.models import User
        from sqlalchemy import select
        async with async_session() as session:
            result = await session.execute(select(User).limit(1))
            if result.scalar_one_or_none() is None:
                logger.info("Empty database detected, seeding demo data...")
                from app.seed import seed as run_seed
                await run_seed()
                logger.info("Demo data seeded successfully")
    except Exception as e:
        logger.warning(f"Auto-seed skipped: {e}")

    # Start device simulator (skip in serverless environments)
    is_serverless = os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
    if settings.SIMULATOR_ENABLED and not is_serverless:
        from app.simulator import run_simulator
        simulator_task = asyncio.create_task(
            run_simulator(settings.SIMULATOR_INTERVAL_SECONDS)
        )
        logger.info("Device simulator started")

    yield

    # Shutdown
    if simulator_task:
        simulator_task.cancel()
        try:
            await simulator_task
        except asyncio.CancelledError:
            pass
    logger.info("SentinelAI shutdown complete")


app = FastAPI(
    title="SentinelAI API",
    description="AI-Based Real-Time Behavioral Cybersecurity Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}")
    logger.error(traceback.format_exc())
    return JSONResponse(status_code=500, content={"detail": str(exc)})

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth_router.router)
app.include_router(logs_router.router)
app.include_router(student_router.router)
app.include_router(admin_router.router)
app.include_router(devices_router.router)
app.include_router(profiles_router.router)
app.include_router(incidents_router.router)
app.include_router(privacy_router.router)
app.include_router(escalate_router.router)
app.include_router(anomalies_router.router)


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "websocket_connections": manager.connected_count,
    }


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Keep-alive / echo
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception:
        manager.disconnect(websocket, user_id)
