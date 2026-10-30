# Cloud Security Monitoring System with Incident Management Assistance

**Infosys Springboard Internship | Java Domain**  
**Team Lead:** Dhanushka  
**Project Version:** 1.1.0  
**License:** MIT  

[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-teal.svg)](https://fastapi.tiangolo.com/)

---

## 1. Overview
The **Cloud Security Monitoring System** is a real-time SOC (Security Operations Center) platform designed to handle security incident ingestion, smart automated routing to on-shift analysts based on a multi-factor scoring model, proactive SLA tracking with automated 2-tier escalation, and live executive dashboard monitoring.

### Core Modules
1. **Module 01: Auth & RBAC**
   - JWT authentication with secure HTTP-only refresh cookie rotation.
   - Strict role hierarchy: `ADMIN > ANALYST > VIEWER`.
   - Optional TOTP 2-Factor Authentication (MFA).
   - Account lockout protection (5 failed attempts locks for 15 minutes).
2. **Module 02: User & Team Management**
   - User directory and role delegation.
   - Team membership with designated Team Leads.
   - Skill competencies (levels 1–3) mapped to attack vectors.
   - 24/7 rotating shift scheduling with visual coverage timeline and handover briefs.
3. **Module 03: Executive Security Dashboard**
   - Live threat score gauge (P1=8, P2=4, P3=2, P4=1) calibrated to Low, Elevated, High, and Critical.
   - Open incidents and MTTR (Mean Time to Remediation) analytics.
   - 14-day daily and 24-hour hourly trend histograms.
   - Analyst workload distribution (weighted open queue: P1=3, P2=2, P3=1, P4=0.5).
   - Statistical volume anomaly detection and shift coverage gap warnings.
4. **Module 05: Incident Management & Smart Routing**
   - Transparent 100-point smart routing algorithm:
     $$\text{Total Score} = \text{Skill (40)} + \text{Workload (30)} + \text{History (20)} + \text{Runway (10)}$$
   - Proactive SLA deadline timers: P1 (15m), P2 (60m), P3 (4h), P4 (24h).
   - Automated 2-tier escalation: Level 1 at 25% (unacknowledged, routes to Lead) and Level 2 at 75% (routes to Admin).
   - Drag-and-drop Kanban board with optimistic UI and rollback protection.
   - Reopening workflow with mandatory justification (5–500 chars).

---

## 2. Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|                                                                                   |
|                   React 18 + TypeScript + Vite SPA (:5173)                        |
|        [Dashboard]  [Kanban Board]  [24h Shift Timeline]  [Audit Dossier]        |
+------------------------------------------+----------------------------------------+
                                           | HTTP / REST (JWT in Bearer Header)
                                           v
+-----------------------------------------------------------------------------------+
|                                APPLICATION TIER                                   |
|                                                                                   |
|               Spring Boot 3.2.4 REST API & Security Engine (:8080)                |
|  - JWT & RBAC Filter               - Smart Routing Engine (100-pt Multi-factor)   |
|  - SLA & Escalation Scheduler      - Incident Lifecycle & Audit Trail Controller  |
|  - Flyway Database Migrations      - Actuator Health & Metrics                    |
+----------------------+------------------------------------+-----------------------+
                       |                                    |
          Internal REST| (X-Analytics-Key)       PostgreSQL | (HikariCP, Flyway V1-V3)
                       v                                    v
+-------------------------------+   +-----------------------------------------------+
|         ANALYTICS TIER        |   |                 DATABASE TIER                 |
|                               |   |                                               |
|    FastAPI Microservice (:8000)|   |              PostgreSQL 16 (:5432)            |
|  - NumPy anomaly detection    |   |  - users & user_skills (check level 1..3)     |
|  - Shift coverage gap forecast|   |  - teams & team_members                       |
|  - Resolution statistics      |   |  - incidents & incident_events (audit)        |
+---------------+---------------+   |  - shifts & sla_policies                      |
                |                   +-----------------------------------------------+
                | SELECT (analytics_ro)                     ^
                +-------------------------------------------+
                                                            |
                                                 Simulation | (X-Sim-Key)
+-----------------------------------------------------------+-----------------------+
|                              SIMULATION TIER                                      |
|                                                                                   |
|           Python Threat Simulator (MITRE ATT&CK T1110, T1567, T1486, T1046)       |
|           - Deterministic burst replay (--seed 42 --dry-run)                      |
+-----------------------------------------------------------------------------------+
```

---

## 3. Monorepo Structure

```text
cloud-security-monitoring-system/
├── backend/             # Spring Boot 3 Java backend service
│   ├── src/main/java/   # Core controllers, services, repositories, security
│   └── src/main/resources/db/migration/ # Flyway schema & reference data
├── frontend/            # React 18 TypeScript Vite frontend SPA
│   ├── src/features/    # Feature modules: auth, dashboard, incidents, user-management
│   └── src/components/  # Reusable UI library (Button, Modal, Input, Badge, SlaTimer)
├── analytics/           # Python FastAPI statistical anomaly & coverage service
│   ├── app/             # FastAPI endpoints, database connector, NumPy calculations
│   └── tests/           # Unit tests for analytics service
├── simulator/           # Python threat event & attack scenario simulator
│   ├── simulate.py      # Real-time incident generator with MITRE ATT&CK techniques
│   └── seed_history.py  # Historical incident generator for MTTR & anomaly baselines
├── docker-compose.yml   # Multi-service container orchestration
└── .env.example         # Master environment variables template
```

---

## 4. Getting Started

### Prerequisites
- **Java**: 17 JDK
- **Maven**: 3.9+
- **Node.js**: 20+ & npm 10+
- **Python**: 3.11+
- **PostgreSQL**: 16 (running locally on port 5432)

### Step 1: Environment Setup
Copy the environment template:
```bash
cp .env.example .env
cd frontend && cp .env.example .env && cd ..
```

### Step 2: Database Initialization
Create the database in PostgreSQL:
```sql
CREATE DATABASE cloudsec;
```
*(Flyway will automatically execute migrations `V1`, `V2`, and `V3` when the backend boots).*

### Step 3: Run the Services

#### A. Spring Boot Backend
```bash
cd backend
mvn spring-boot:run
```
- API Base: `http://localhost:8080`
- Swagger UI Documentation: `http://localhost:8080/swagger-ui.html`
- Actuator Health: `http://localhost:8080/actuator/health`

#### B. React Frontend
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

#### C. Python Analytics Service
```bash
cd analytics
python -m venv .venv
# On Windows: .\.venv\Scripts\activate
# On Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```
- Analytics Health: `http://localhost:8000/health`

#### D. Python Attack Simulator
```bash
cd simulator
python -m venv .venv
# On Windows: .\.venv\Scripts\activate
pip install -r requirements.txt

# Run deterministic dry-run preview:
python simulate.py --seed 42 --dry-run

# Ingest live simulated attacks:
python simulate.py --scenario brute-force-burst --rate 5 --duration 10
```

---

## 5. Default Development Credentials

Configured in `.env` (`DEV_DEFAULT_PASSWORD=CloudSec_Local_2026_Secure!`):

| Role | Email | Seed Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@cloudsec.local` | `.env: DEV_DEFAULT_PASSWORD` | Full access: users, shifts, policies, assignments, overrides |
| **Analyst (Lead)** | `alice.analyst@cloudsec.local` | `.env: DEV_DEFAULT_PASSWORD` | CIR squad lead (on shift): investigate, resolve, triage |
| **Analyst (Lead)** | `bob.analyst@cloudsec.local` | `.env: DEV_DEFAULT_PASSWORD` | Threat Intel lead: investigate, resolve, triage |
| **Viewer** | `ravi.kumar@cloudsec.local` | `.env: DEV_DEFAULT_PASSWORD` | Read-only visibility: dashboard, incident dossier |

---

## 6. Running Automated Tests

```bash
# 1. Backend tests (Surefire unit & integration tests)
cd backend && mvn test

# 2. Frontend tests (Vitest)
cd frontend && npm test -- --run

# 3. Analytics microservice tests (Pytest)
cd analytics && .venv/bin/pytest
```
