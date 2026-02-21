# SentinelAI

> AI-Based Real-Time Behavioral Cybersecurity Platform for Students

Detect smartphone behavioral anomalies using AI and get real-time security alerts through a premium dashboard.

## 🏗 Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Recharts |
| Backend | FastAPI, SQLAlchemy (async), Pydantic |
| Database | PostgreSQL |
| Cache | Redis |
| AI Engine | scikit-learn (Isolation Forest) + rule-based fallback |
| Auth | JWT (access + refresh), bcrypt |
| Real-time | WebSocket |
| Deployment | Docker Compose, Nginx |

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- OR: Python 3.11+, Node.js 20+, PostgreSQL 16+

### Option 1: Docker (recommended)

```bash
# Clone and start
cp .env.example .env
docker-compose up --build

# Seed demo data (in another terminal)
docker-compose exec backend python -m app.seed
```

App is available at **http://localhost**

### Option 2: Local Development

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt

# Start PostgreSQL and set DATABASE_URL in .env
uvicorn app.main:app --reload --port 8000

# Seed data
python -m app.seed
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000 | Backend: http://localhost:8000 | API Docs: http://localhost:8000/docs

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sentinelai.com | admin123 |
| Student | student1@university.edu | student123 |

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/register | Create account |
| POST | /api/login | Login (returns JWT) |
| GET | /api/profile | Current user profile |
| POST | /api/consent | Grant monitoring consent |
| POST | /api/logs | Ingest behavior log |
| GET | /api/risk-score | Get risk score |
| GET | /api/alerts | Get alerts |
| GET | /api/logs/recent | Recent behavior logs |
| POST | /api/block-app | Block an app |
| POST | /api/resolve-alert | Resolve alert |
| GET | /api/admin/stats | Admin statistics |
| GET | /api/admin/high-risk-users | High risk users |
| GET | /api/admin/export-report | Export CSV report |
| WS | /ws/{user_id} | Real-time alerts |

## 🧠 AI Engine

**Risk Score Formula:**
```
Risk = (Permission anomaly × 0.3) + (Network anomaly × 0.3) +
       (Background process anomaly × 0.2) + (Suspicious domain × 0.2)
```

- **Primary**: Isolation Forest (scikit-learn) trained on behavioral logs
- **Fallback**: Rule-based scoring when ML fails
- **Recalculation**: Every log ingestion + simulator runs every 30s

## 📱 Device Simulator

Since browsers can't access phone sensors, a built-in simulator:
- Generates realistic behavioral logs
- Introduces controlled anomalies (20-35% chance)
- Runs every 30 seconds for all consented students
- Includes suspicious apps: SuspiciousVPN, CryptoMiner, KeyLogger, UnknownAPK

## ☁️ Cloud Deployment

Ready for: AWS ECS, Azure Container Apps, Render, Railway

```bash
# Build production images
docker-compose -f docker-compose.yml build

# Push to registry
docker tag sentinelai-backend your-registry/sentinelai-backend:latest
docker push your-registry/sentinelai-backend:latest
```

Set environment variables on your cloud platform using `.env.example` as reference.

## 📁 Project Structure

```
buildathon/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Settings
│   │   ├── database.py          # Async SQLAlchemy
│   │   ├── models.py            # ORM models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── auth.py              # JWT + bcrypt
│   │   ├── deps.py              # Dependencies
│   │   ├── ai_engine.py         # ML risk scoring
│   │   ├── simulator.py         # Device agent simulator
│   │   ├── websocket_manager.py # WebSocket manager
│   │   ├── seed.py              # Demo data
│   │   └── routers/
│   │       ├── auth_router.py
│   │       ├── logs_router.py
│   │       ├── student_router.py
│   │       └── admin_router.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── login/           # Login
│   │   │   ├── register/        # Register
│   │   │   ├── consent/         # Consent flow
│   │   │   ├── dashboard/       # Student dashboard
│   │   │   └── admin/           # Admin dashboard
│   │   └── lib/api.ts           # API client
│   ├── tailwind.config.ts
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── .env.example
└── README.md
```
