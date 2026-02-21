from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ──── Enums ────
class RoleEnum(str, Enum):
    student = "student"
    parent = "parent"
    admin = "admin"

class RiskLevelEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class ReportTypeEnum(str, Enum):
    false_positive = "false_positive"
    other = "other"


# ──── Auth Schemas ────
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    college: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    role: RoleEnum = RoleEnum.student


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    college: str
    role: str
    consent_given: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


# ──── Consent ────
class ConsentRequest(BaseModel):
    accept_terms: bool
    enable_monitoring: bool


# ──── Devices ────
class RegisterDeviceRequest(BaseModel):
    device_name: str = Field(..., max_length=255)
    device_type: str = Field(..., max_length=100)

class DeviceResponse(BaseModel):
    id: str
    user_id: str
    device_name: str
    device_type: str
    last_active: datetime
    risk_score: float

    class Config:
        from_attributes = True


# ──── Behavior Profiles ────
class BehaviorProfileResponse(BaseModel):
    user_id: str
    baseline_metrics: Dict[str, Any]
    last_updated: datetime

    class Config:
        from_attributes = True


# ──── Behavior Logs ────
class LogIngestRequest(BaseModel):
    app_name: str = Field(..., max_length=255)
    device_id: Optional[str] = None
    permission_requested: str = Field(default="none", max_length=255)
    network_activity_level: float = Field(default=0.0, ge=0.0, le=100.0)
    background_process_flag: bool = False
    anomaly_flag: bool = False
    extra_data: Optional[dict] = None


class LogResponse(BaseModel):
    id: int
    user_id: str
    device_id: Optional[str]
    timestamp: datetime
    app_name: str
    permission_requested: Optional[str]
    network_activity_level: float
    background_process_flag: bool
    anomaly_flag: bool
    anomaly_type: Optional[str]
    severity: Optional[str]
    anomaly_score: Optional[float]

    class Config:
        from_attributes = True


# ──── Risk Score ────
class RiskScoreResponse(BaseModel):
    current_score: float
    risk_level: str
    last_updated: Optional[datetime]

    class Config:
        from_attributes = True


# ──── Alerts ────
class AlertResponse(BaseModel):
    id: int
    user_id: str
    alert_type: str
    severity: str
    message: str
    explanation_text: Optional[str]
    recommendation: Optional[str]
    confidence_score: float
    created_at: datetime
    resolved: bool

    class Config:
        from_attributes = True


class ResolveAlertRequest(BaseModel):
    alert_id: int


class BlockAppRequest(BaseModel):
    app_name: str


# ──── Incidents ────
class ReportIncidentRequest(BaseModel):
    alert_id: int
    report_type: ReportTypeEnum = ReportTypeEnum.false_positive
    description: Optional[str] = None

class IncidentResponse(BaseModel):
    id: int
    alert_id: int
    user_id: str
    report_type: str
    description: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ──── Privacy (DataAccessLogs) ────
class DataAccessLogResponse(BaseModel):
    id: int
    user_id: str
    data_type: str
    purpose: str
    timestamp: datetime

    class Config:
        from_attributes = True


# ──── Admin ────
class AdminStatsResponse(BaseModel):
    total_users: int
    total_students: int
    total_admins: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    total_alerts: int
    unresolved_alerts: int
    risk_distribution: dict


class HighRiskUserResponse(BaseModel):
    id: str
    name: str
    email: str
    college: str
    current_score: float
    risk_level: str

    class Config:
        from_attributes = True

# ──── Integration ────
class EscalateRequest(BaseModel):
    user_id: str
    reason: str

# ──── Analytics ────
class TimelinePoint(BaseModel):
    timestamp: str
    risk_score: float

class HeatmapPoint(BaseModel):
    hour: int
    frequency: int


# ──── WebSocket ────
class WSAlertMessage(BaseModel):
    type: str = "alert"
    alert_id: int
    alert_type: str
    severity: str
    message: str
    recommendation: Optional[str]
    timestamp: str


# ──── Wellbeing ────
class AppUsageItem(BaseModel):
    app_name: str
    usage_minutes: float
    sessions: int

class WellbeingResponse(BaseModel):
    screen_time_hours: float
    focus_score: int
    daily_sessions: int
    top_apps: list[AppUsageItem]
    daily_trend: list[dict]


# ──── Permission Audit ────
class PermissionBreakdown(BaseModel):
    permission: str
    count: int
    percentage: float

class PermissionAuditResponse(BaseModel):
    total_requests: int
    breakdown: list[PermissionBreakdown]
    risky_apps: list[str]


# ──── Leaderboard ────
class LeaderboardResponse(BaseModel):
    rank: int
    total_students: int
    percentile: int
    user_score: float
    campus_average: float
    categories: dict  # { "network": x, "permissions": x, "apps": x, "behavior": x }
    campus_categories: dict


# ──── Training ────
class TrainingModule(BaseModel):
    id: str
    title: str
    description: str
    difficulty: str
    duration_minutes: int
    completed: bool
    score: Optional[int] = None

class TrainingProgressResponse(BaseModel):
    modules: list[TrainingModule]
    completed_count: int
    total_count: int
    overall_score: int


# ──── Admin: Activity Feed ────
class ActivityFeedItem(BaseModel):
    id: int
    student_name: str
    student_email: str
    alert_type: str
    severity: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True


# ──── Admin: Trends ────
class TrendPoint(BaseModel):
    date: str
    avg_risk_score: float
    alert_count: int
    anomaly_count: int


# ──── Admin: College Breakdown ────
class CollegeBreakdownItem(BaseModel):
    college: str
    total_students: int
    high_risk: int
    medium_risk: int
    low_risk: int
    avg_score: float


# ──── Admin: All Users ────
class UserListItem(BaseModel):
    id: str
    name: str
    email: str
    college: str
    role: str
    consent_given: bool
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    alert_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

