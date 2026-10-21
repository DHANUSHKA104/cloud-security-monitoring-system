# Cloud Security Monitoring System with Incident Management Assistance

**Infosys Springboard Internship | Java Domain**  
**Team Lead:** Dhanushka  
**Project Version:** 1.1

---

## 1. Overview
The **Cloud Security Monitoring System** is a real-time SOC (Security Operations Center) platform designed to handle security incident ingestion, smart automated routing to on-shift analysts based on a multi-factor scoring model, proactive SLA tracking with automated 2-tier escalation, and live executive dashboard monitoring.

### Core Modules (Phase Scope)
1. **Module 01: Auth & RBAC** - JWT authentication, refresh token rotation, role hierarchy (`ADMIN > ANALYST > VIEWER`), optional TOTP MFA, and account lockout protection.
2. **Module 02: User & Team Management** - User directory, role delegation, team membership with Team Leads, skill mapping (levels 1-3), and 24/7 rotating shift scheduling with handover briefs.
3. **Module 03: Security Dashboard** - Live threat gauges, open incident counters, MTTR trends, workload analytics, at-risk queues, real-time event feed, and statistical anomaly insights.
4. **Module 05: Incident Management** - Incident triage lifecycle, smart routing engine ("Why this analyst?" explanation), SLA countdown timers, automated escalation at 25% and 75% thresholds, and interactive Kanban board.

---

## 2. Monorepo Architecture
```text
cloud-security-monitoring-system/
├── frontend/            # React 18, TypeScript, Vite, Tailwind CSS (Mentor-specified tree)
├── backend/             # Java 17, Spring Boot 3, Maven, PostgreSQL, Flyway
├── simulator/           # Python 3.11+ Incident & Attack Simulator
├── analytics/           # Python 3.11+ FastAPI Statistical Analytics Service
├── docs/                # API contracts, architectural decisions, and demo scripts
├── docker-compose.yml   # Multi-container orchestration (PostgreSQL + Backend + Analytics)
├── .env.example         # Template for environment variables
└── README.md
```

---

## 3. Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, Recharts, @dnd-kit.
- **Backend**: Java 17, Spring Boot 3, Spring Security, Spring Data JPA, Bean Validation, Flyway, springdoc-openapi, JJWT.
- **Database**: PostgreSQL 16.
- **Python Services**: Python 3.11+, FastAPI, Pydantic, Psycopg 3.

---

## 4. Getting Started (Phase 0)

### Prerequisites
- Java 17 JDK
- Apache Maven 3.9+
- Node.js 20+ & npm 10+
- Python 3.11+
- PostgreSQL 16 (Local instance or Docker Compose)

### Environment Configuration
Copy the template and configure your local environment:
```bash
cp .env.example .env
cd frontend && cp .env.example .env && cd ..
```

### Running with Docker Compose
```bash
docker compose up -d postgres
```

### Running Locally
1. **Database**: Ensure PostgreSQL 16 is running on `localhost:5432` with database `cloudsec`.
2. **Backend**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   API runs on `http://localhost:8080` (Swagger UI at `http://localhost:8080/swagger-ui.html`).
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Application runs on `http://localhost:5173`.
