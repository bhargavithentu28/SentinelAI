from pydantic_settings import BaseSettings
from functools import lru_cache
import os

# On Vercel, filesystem is read-only except /tmp
_default_db = "sqlite+aiosqlite:////tmp/sentinelai.db" if os.environ.get("VERCEL") else "sqlite+aiosqlite:///./sentinelai.db"


class Settings(BaseSettings):
    APP_NAME: str = "SentinelAI"
    DEBUG: bool = False

    # Database — defaults to SQLite for easy local dev
    DATABASE_URL: str = _default_db

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = False

    # JWT
    SECRET_KEY: str = "super-secret-change-in-production-abc123xyz"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:80,http://localhost,https://frontend-gray-rho-42.vercel.app,https://*.vercel.app"

    # Simulator
    SIMULATOR_ENABLED: bool = True
    SIMULATOR_INTERVAL_SECONDS: int = 30

    # Rate limiting
    RATE_LIMIT: str = "60/minute"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
