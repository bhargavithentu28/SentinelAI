import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Float, DateTime, ForeignKey, Text, Integer, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    college = Column(String(255), nullable=False)
    role = Column(String(20), default="student", nullable=False)
    hashed_password = Column(String(255), nullable=False)
    consent_given = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    risk_scores = relationship("RiskScore", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")
    behavior_logs = relationship("BehaviorLog", back_populates="user", cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="user", cascade="all, delete-orphan")
    profile = relationship("BehaviorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="user", cascade="all, delete-orphan")
    data_access_logs = relationship("DataAccessLog", back_populates="user", cascade="all, delete-orphan")


class Device(Base):
    __tablename__ = "devices"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_name = Column(String(255), nullable=False)
    device_type = Column(String(100), nullable=False)
    last_active = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    risk_score = Column(Float, default=0.0)
    
    user = relationship("User", back_populates="devices")
    behavior_logs = relationship("BehaviorLog", back_populates="device", cascade="all, delete-orphan")


class BehaviorProfile(Base):
    __tablename__ = "behavior_profiles"
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    baseline_metrics = Column(JSON, default={})
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    current_score = Column(Float, default=0.0)
    risk_level = Column(String(20), default="low")
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="risk_scores")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    explanation_text = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    confidence_score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Boolean, default=False)

    user = relationship("User", back_populates="alerts")
    incidents = relationship("Incident", back_populates="alert", cascade="all, delete-orphan")


class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(Integer, ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    report_type = Column(String(100), nullable=False) # e.g., "false_positive"
    description = Column(Text, nullable=True)
    status = Column(String(50), default="open") # open, reviewed, resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    
    alert = relationship("Alert", back_populates="incidents")
    user = relationship("User", back_populates="incidents")


class DataAccessLog(Base):
    __tablename__ = "data_access_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    data_type = Column(String(100), nullable=False)
    purpose = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="data_access_logs")


class IntegrationConfig(Base):
    __tablename__ = "integration_configs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    integration_type = Column(String(100), nullable=False) # e.g. "webhook", "email"
    endpoint = Column(String(255), nullable=False)
    status = Column(String(50), default="active") # active, inactive


class BehaviorLog(Base):
    __tablename__ = "behavior_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id = Column(String(36), ForeignKey("devices.id", ondelete="CASCADE"), nullable=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    app_name = Column(String(255))
    permission_requested = Column(String(255))
    network_activity_level = Column(Float, default=0.0)
    background_process_flag = Column(Boolean, default=False)
    anomaly_flag = Column(Boolean, default=False)
    anomaly_type = Column(String(100), nullable=True)
    severity = Column(String(20), nullable=True)
    anomaly_score = Column(Float, nullable=True)
    log_data = Column(JSON, default={})
    
    user = relationship("User", back_populates="behavior_logs")
    device = relationship("Device", back_populates="behavior_logs")
