<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
</p>

<h1 align="center">🛡️ SentinelAI</h1>

<p align="center">
  <b>AI-Powered Real-Time Behavioral Cybersecurity Platform for Students</b>
</p>

<p align="center">
  <i>Detect smartphone behavioral anomalies using machine learning, get real-time security alerts, and monitor digital wellbeing — all through a premium, interactive dashboard.</i>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [Demo Credentials](#-demo-credentials)
- [API Documentation](#-api-documentation)
- [AI Engine](#-ai-engine)
- [Device Simulator](#-device-simulator)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**SentinelAI** is a full-stack AI-powered cybersecurity platform designed for educational institutions to monitor and protect students' digital behavior in real time. It combines **machine learning anomaly detection** with an intuitive, modern dashboard to provide actionable security insights.

The platform continuously analyzes smartphone behavioral patterns — app usage, network activity, permission requests, and background processes — to calculate dynamic risk scores and trigger instant alerts when suspicious behavior is detected.

### 🎯 Problem Statement

Students are increasingly vulnerable to cybersecurity threats including phishing, malware, unauthorized data access, and social engineering attacks. Traditional security tools are reactive and lack real-time behavioral analysis. SentinelAI bridges this gap by providing:

- **Proactive threat detection** through continuous behavioral monitoring
- **AI-driven risk scoring** that adapts to individual usage patterns
- **Real-time alerts** delivered via WebSocket for immediate response
- **Educational training** to improve students' security awareness

---

## ✨ Key Features

### 🎓 Student Dashboard
| Feature | Description |
|---------|-------------|
| **Dynamic Risk Gauge** | Animated circular gauge showing real-time risk score (0–100) with color-coded severity levels |
| **Alert Summary** | At-a-glance view of unresolved alerts, recent logs, and anomaly counts |
| **Risk Analytics Heatmap** | Time-series visualization of risk score fluctuations throughout the day |
| **Behavior Feed** | Live scrolling feed of recent app activities and behavioral events |
| **App Permission Audit** | Interactive donut chart breaking down which permissions apps are requesting |
| **Digital Wellbeing** | Screen time tracking, focus scores, session counts, and top app usage bar charts |
| **Peer Security Comparison** | Radar chart comparing your security posture against campus averages with rank & percentile |
| **Security Badges** | Gamified achievement badges for maintaining good security hygiene |
| **Device Switcher** | Monitor multiple registered devices from a single dashboard |
| **Real-time WebSocket Alerts** | Instant modal notifications when new high-severity threats are detected |

### 🏫 Admin Dashboard
| Feature | Description |
|---------|-------------|
| **System Overview Cards** | Total users, high-risk students, total alerts, and unresolved alert counts |
| **Risk Distribution Chart** | Pie chart showing the distribution of low, medium, and high-risk students |
| **14-Day Trend Analysis** | Composite chart tracking risk scores, alert counts, and anomaly trends over two weeks |
| **College Breakdown** | Stacked bar chart showing risk level distribution grouped by institution |
| **Live Threat Feed** | Real-time scrolling feed of alerts across all students with severity badges |
| **High-Risk Students Table** | Sortable table of students flagged as high risk with scores and contact info |
| **User Management** | Searchable, filterable table of all users with role, risk, consent status, and join date |
| **CSV Export** | One-click export of all student risk data for offline analysis |

### 📚 Security Training Center
| Feature | Description |
|---------|-------------|
| **6 Interactive Modules** | Phishing Detection, Password Security, Social Engineering, Public Wi-Fi Safety, App Permissions, Data Privacy |
| **Quizzes with Scoring** | Multiple-choice quizzes with instant feedback: correct/incorrect highlighting |
| **Progress Tracking** | Visual progress bars and completion percentages per module |
| **XP System** | Points earned per completed module to gamify learning |
| **Difficulty Levels** | Beginner, intermediate, and advanced content for progressive learning |

### 🔐 Additional Pages
| Page | Description |
|------|-------------|
| **Landing Page** | Premium marketing page with hero section, feature highlights, architecture overview, and call-to-action |
| **Registration** | Full sign-up flow with name, email, password, college, and role selection |
| **Consent Flow** | GDPR-style consent management before monitoring begins |
| **Incidents** | View and manage security incidents with severity levels and resolution status |
| **Privacy Center** | Manage data preferences, view access logs, and request data deletion |

---

## 🏗 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14, TypeScript | Server-side rendering, routing, React framework |
| **Styling** | Tailwind CSS, CSS Modules | Utility-first styling with custom glassmorphism theme |
| **Animations** | Framer Motion | Page transitions, hover effects, entrance animations |
| **Charts** | Recharts | Risk gauge, heatmaps, pie charts, radar charts, bar charts |
| **Icons** | Lucide React | Consistent, modern icon set |
| **Backend** | FastAPI (Python) | Async REST API with auto-generated OpenAPI docs |
| **ORM** | SQLAlchemy (async) | Database models and queries with full async support |
| **Validation** | Pydantic v2 | Request/response schema validation |
| **Auth** | JWT + bcrypt | Stateless authentication with access/refresh tokens |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Relational data storage with async drivers |
| **Cache** | Redis (optional) | Session caching and rate limit storage |
| **AI/ML** | scikit-learn | Isolation Forest for anomaly detection |
| **Real-time** | WebSocket | Instant alert delivery to connected dashboards |
| **Rate Limiting** | SlowAPI | Endpoint-level request throttling |
| **Deployment** | Docker Compose, Nginx | Containerized multi-service deployment |

---

## 🏛 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Nginx (Port 80)                     │
│              Reverse Proxy + Load Balancer              │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
    ┌──────────▼──────────┐ ┌────────▼────────────────┐
    │   Next.js Frontend  │ │    FastAPI Backend       │
    │     (Port 3000)     │ │      (Port 8000)        │
    │                     │ │                          │
    │  • Landing Page     │ │  • REST API (25+ routes) │
    │  • Student Dashboard│ │  • WebSocket Server      │
    │  • Admin Dashboard  │ │  • AI Risk Engine        │
    │  • Training Center  │ │  • Device Simulator      │
    │  • Auth Pages       │ │  • JWT Auth + RBAC       │
    └─────────────────────┘ └──────────┬───────────────┘
                                       │
                            ┌──────────▼──────────┐
                            │   PostgreSQL / SQLite │
                            │   (Data Persistence)  │
                            └───────────────────────┘
```

### Data Flow

```
Device Logs → API Ingestion → Feature Extraction → AI Model (Isolation Forest)
    ↓                                                    ↓
Behavior DB  ←──────────────────────────── Risk Score Calculation
    ↓                                                    ↓
Dashboard ← WebSocket ← Alert Generation ← Threshold Check (score > 70)
```

---

## 🖼 Screenshots

### Student Dashboard
The student dashboard provides a comprehensive view of your security posture with real-time risk scoring, alert summaries, permission auditing, and digital wellbeing metrics.

### Admin Dashboard
Administrators get a bird's-eye view of all students with risk distribution charts, 14-day trend analysis, college breakdowns, live threat feeds, and full user management capabilities.

### Security Training Center
Interactive security training with quizzes, progress tracking, and an XP-based gamification system across 6 cybersecurity modules.

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+** and **Node.js 20+** (for local development)
- **Docker & Docker Compose** (for containerized deployment)

### Option 1: Local Development (Recommended for Development)

**1. Clone the repository:**
```bash
git clone https://github.com/bhargavithentu28/SentinelAI.git
cd SentinelAI
```

**2. Set up the Backend:**
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn app.main:app --reload --port 8000

# Seed demo data (in a separate terminal)
python -m app.seed
```

**3. Set up the Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

**4. Access the application:**
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Documentation | http://localhost:8000/docs |
| WebSocket | ws://localhost:8000/ws/{user_id} |

### Option 2: Docker Compose (Recommended for Production)

```bash
# Copy environment variables
cp .env.example .env

# Build and start all services
docker-compose up --build

# Seed demo data (in another terminal)
docker-compose exec backend python -m app.seed
```

The app will be available at **http://localhost** (via Nginx reverse proxy).

---

## 🔑 Demo Credentials

The seed script creates the following demo accounts:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Admin** | admin@sentinelai.com | admin123 | Full admin dashboard access |
| **Student 1** | student1@university.edu | student123 | Demo student with behavioral data |
| **Student 2** | student2@university.edu | student123 | Demo student with behavioral data |
| **Student 3** | student3@university.edu | student123 | Demo student with behavioral data |
| **Student 4** | student4@university.edu | student123 | Demo student with behavioral data |
| **Student 5** | student5@university.edu | student123 | Demo student with behavioral data |

> **Note:** The device simulator automatically generates behavioral logs for all consented students every 30 seconds, so data will appear in the dashboards shortly after seeding.

---

## 📡 API Documentation

The full interactive API documentation is available at `/docs` (Swagger UI) when the backend is running.

### Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/register` | Create a new user account | ❌ |
| `POST` | `/api/login` | Authenticate and receive JWT tokens | ❌ |
| `GET` | `/api/profile` | Get current user profile | 🔒 |
| `POST` | `/api/consent` | Grant/revoke monitoring consent | 🔒 |

### Student Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/risk-score` | Get current risk score and level | 🔒 |
| `GET` | `/api/alerts` | Get user's security alerts | 🔒 |
| `GET` | `/api/logs/recent` | Get recent behavior logs | 🔒 |
| `GET` | `/api/devices` | List registered devices | 🔒 |
| `POST` | `/api/logs` | Ingest a new behavior log | 🔒 |
| `POST` | `/api/block-app` | Block a specific application | 🔒 |
| `POST` | `/api/resolve-alert` | Mark an alert as resolved | 🔒 |
| `GET` | `/api/wellbeing` | Digital wellbeing metrics | 🔒 |
| `GET` | `/api/permission-audit` | App permission breakdown | 🔒 |
| `GET` | `/api/leaderboard` | Peer security comparison | 🔒 |
| `GET` | `/api/training-progress` | Training module completion | 🔒 |
| `GET` | `/api/anomalies/timeline` | Anomaly timeline data | 🔒 |
| `GET` | `/api/anomalies/heatmap` | Risk heatmap data | 🔒 |

### Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/admin/stats` | Aggregate statistics | 🔒👑 |
| `GET` | `/api/admin/high-risk-users` | List high-risk students | 🔒👑 |
| `GET` | `/api/admin/export-report` | Export CSV report | 🔒👑 |
| `GET` | `/api/admin/activity-feed` | Live alert feed (all students) | 🔒👑 |
| `GET` | `/api/admin/trends` | 14-day risk & alert trends | 🔒👑 |
| `GET` | `/api/admin/college-breakdown` | Risk by institution | 🔒👑 |
| `GET` | `/api/admin/all-users` | Searchable user list | 🔒👑 |

### WebSocket

| Protocol | Endpoint | Description |
|----------|----------|-------------|
| `WS` | `/ws/{user_id}` | Real-time alert notifications |

> 🔒 = Requires JWT token &nbsp;&nbsp; 👑 = Admin role required

---

## 🧠 AI Engine

SentinelAI uses a dual-layer AI approach for risk scoring:

### Layer 1: Isolation Forest (Primary)

The **Isolation Forest** algorithm from scikit-learn is trained on behavioral log features to detect outliers:

```python
Features extracted per log:
├── permission_requested  (0 or 1)  — Was a sensitive permission requested?
├── network_activity_level (0-100)  — How much network bandwidth was used?
├── background_process_flag (0 or 1) — Was the app running in the background?
└── anomaly_flag (0 or 1)           — Was a known suspicious pattern matched?
```

- **Contamination**: 15% (assumes up to 15% of data points are anomalous)
- **Ensemble**: 100 decision trees for robust outlier detection
- **Adaptive**: Model refits as new data arrives

### Layer 2: Rule-Based Scoring (Fallback)

When the ML model has insufficient data (< 5 logs) or fails, a weighted rule-based system activates:

```
Risk Score = (Permission anomaly × 0.30)
           + (Network anomaly   × 0.30)
           + (Background process × 0.20)
           + (Suspicious domain  × 0.20)
```

### Baseline Deviation Penalty

Both layers incorporate **baseline deviation detection** — comparing recent behavior against the user's historical average. Sudden spikes in permission requests or network activity add additional risk points.

### Risk Levels & Alert Thresholds

| Score Range | Level | Color | Action |
|------------|-------|-------|--------|
| 0 – 40 | Low | 🟢 Green | No action needed |
| 41 – 70 | Medium | 🟡 Amber | Monitor closely |
| 71 – 84 | High | 🔴 Red | Alert generated |
| 85 – 100 | Critical | 🔴 Red | Immediate alert + recommendation |

---

## 📱 Device Simulator

Since web browsers cannot access mobile device sensors, SentinelAI includes a **built-in device simulator** that generates realistic behavioral data:

### How It Works

1. **Runs automatically** every 30 seconds for all consented students
2. **Generates realistic logs** including app name, permissions, network levels, and process flags
3. **Introduces anomalies** with a 20–35% probability per log entry
4. **Suspicious apps** are injected randomly: `SuspiciousVPN`, `CryptoMiner`, `KeyLogger`, `UnknownAPK`, `DarkWebBrowser`
5. **Triggers AI recalculation** after each batch of logs
6. **Fires WebSocket alerts** when risk scores cross thresholds

### Normal Apps Simulated

`Instagram`, `WhatsApp`, `Chrome`, `YouTube`, `Gmail`, `Snapchat`, `Discord`, `Calculator`, `Notes`, `Camera`, `Clock`, `Maps`, `Calendar`, `Spotify`, `Slack`, `Teams`

---

## 📁 Project Structure

```
SentinelAI/
├── backend/                          # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # App entry point, lifespan, middleware, WebSocket
│   │   ├── config.py                 # Pydantic settings (env vars)
│   │   ├── database.py               # Async SQLAlchemy engine + session
│   │   ├── models.py                 # ORM models (User, BehaviorLog, Alert, RiskScore, etc.)
│   │   ├── schemas.py                # Pydantic request/response schemas
│   │   ├── auth.py                   # JWT creation, verification, password hashing
│   │   ├── deps.py                   # Dependency injection (auth guards, RBAC)
│   │   ├── ai_engine.py              # Isolation Forest + rule-based risk scoring
│   │   ├── simulator.py              # Automated device behavior simulator
│   │   ├── websocket_manager.py      # WebSocket connection manager
│   │   ├── seed.py                   # Database seeding script (demo data)
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── auth_router.py        # /api/register, /api/login
│   │       ├── logs_router.py        # /api/logs, /api/logs/recent
│   │       ├── student_router.py     # Student-specific endpoints
│   │       ├── admin_router.py       # Admin-specific endpoints
│   │       ├── devices_router.py     # Device management
│   │       ├── profiles_router.py    # User profiles & baselines
│   │       ├── incidents_router.py   # Incident management
│   │       ├── privacy_router.py     # Privacy & data access logs
│   │       ├── escalate_router.py    # Alert escalation & explanation
│   │       └── anomalies_router.py   # Anomaly timeline & heatmap
│   ├── requirements.txt              # Python dependencies
│   └── Dockerfile                    # Backend container image
│
├── frontend/                         # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # Root layout (fonts, metadata)
│   │   │   ├── globals.css           # Global styles + Tailwind imports
│   │   │   ├── page.tsx              # Landing page (marketing)
│   │   │   ├── login/page.tsx        # Login with demo credential buttons
│   │   │   ├── register/page.tsx     # Registration form
│   │   │   ├── consent/page.tsx      # Consent flow
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx          # Student dashboard (main)
│   │   │   │   ├── training/page.tsx # Security training center
│   │   │   │   ├── incidents/page.tsx# Incident management
│   │   │   │   ├── privacy/page.tsx  # Privacy center
│   │   │   │   └── components/
│   │   │   │       └── AlertModal.tsx# Real-time alert modal (WebSocket)
│   │   │   └── admin/page.tsx        # Admin dashboard
│   │   └── lib/
│   │       └── api.ts                # Axios API client + interceptors
│   ├── tailwind.config.ts            # Tailwind configuration
│   ├── next.config.js                # Next.js config (API rewrites)
│   ├── tsconfig.json                 # TypeScript config
│   ├── postcss.config.js             # PostCSS config
│   ├── package.json                  # Node.js dependencies
│   └── Dockerfile                    # Frontend container image
│
├── docker-compose.yml                # Multi-service orchestration
├── nginx.conf                        # Nginx reverse proxy config
├── .env.example                      # Environment variable template
├── .gitignore                        # Git ignore rules
└── README.md                         # This file
```

---

## ☁️ Deployment

### Docker Compose (Production)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with production values (SECRET_KEY, DATABASE_URL, etc.)

# 2. Build and start
docker-compose up -d --build

# 3. Seed initial data
docker-compose exec backend python -m app.seed

# 4. Access
# App: http://localhost (via Nginx)
# API: http://localhost/api/health
# Docs: http://localhost/docs
```

### Services Started by Docker Compose

| Service | Port | Description |
|---------|------|-------------|
| **Nginx** | 80 | Reverse proxy (entry point) |
| **Frontend** | 3000 | Next.js application |
| **Backend** | 8000 | FastAPI application |
| **PostgreSQL** | 5432 | Database |
| **Redis** | 6379 | Cache (optional) |

### Cloud Deployment

The Dockerized setup is ready for deployment on:

- **AWS** — ECS / Fargate / EC2
- **Azure** — Container Apps / ACI
- **GCP** — Cloud Run / GKE
- **Render** / **Railway** — Direct Docker deployment
- **DigitalOcean** — App Platform / Droplets

```bash
# Build production images
docker-compose build

# Tag and push to your registry
docker tag sentinelai-backend your-registry/sentinelai-backend:latest
docker tag sentinelai-frontend your-registry/sentinelai-frontend:latest
docker push your-registry/sentinelai-backend:latest
docker push your-registry/sentinelai-frontend:latest
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./sentinelai.db` | Async database connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection URL |
| `REDIS_ENABLED` | `false` | Enable Redis caching |
| `SECRET_KEY` | (random) | JWT signing secret (change in production!) |
| `CORS_ORIGINS` | `http://localhost:3000,...` | Allowed CORS origins |
| `SIMULATOR_ENABLED` | `true` | Enable device behavior simulator |
| `SIMULATOR_INTERVAL_SECONDS` | `30` | Simulator run interval |
| `RATE_LIMIT` | `60/minute` | API rate limit per IP |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend URL for frontend |

---

## 🔒 Security Features

- **JWT Authentication** — Stateless access + refresh tokens with configurable expiration
- **Password Hashing** — bcrypt with automatic salt generation
- **Role-Based Access Control** — Student, Admin roles with middleware guards
- **Consent Management** — GDPR-compliant opt-in before any behavioral monitoring
- **Rate Limiting** — SlowAPI throttling to prevent abuse (configurable per-endpoint)
- **CORS Protection** — Configurable allowed origins
- **Input Validation** — Pydantic v2 schema validation on all endpoints
- **SQL Injection Prevention** — SQLAlchemy ORM with parameterized queries

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is built for the **Buildathon** hackathon. All rights reserved.

---

<p align="center">
  Built with ❤️ by <b>Bhargavi Thentu</b>
</p>
