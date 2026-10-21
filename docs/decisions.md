# Architectural Decisions and Assumptions Log

**Project:** Cloud Security Monitoring System  
**Version:** 1.1

This document tracks technical decisions and architectural assumptions. Items marked `[Pending mentor confirmation]` are provisional assumptions matching the project specification to be confirmed with the mentor.

---

## 1. Security & Secrets Management
- **DEC-01 [TEAM] Secrets in `.env` only**: No credentials, database passwords, or JWT secrets are stored in Git or markdown files. All local seed passwords and connection strings are read from the environment (`.env`).
- **DEC-02 [TEAM] BCrypt Password Hashing**: Passwords must be at least 10 characters and cannot match the email address. Passwords are hashed using BCrypt.
- **DEC-03 [TEAM] Token Architecture**: Access tokens are short-lived JWTs (15 minutes) held strictly in memory in `tokenManager.ts`. Refresh tokens are held in HttpOnly cookies, hashed in the database, and rotated upon use.

---

## 2. Assumptions Log `[Pending mentor confirmation]`
- **ASM-01 [Pending mentor confirmation]**: Adaptation of `features/document-workflow/` for SLA escalation ladder visualization (`ProcessStages`), SLA policy listing (`ProcessList`), and stretch workflow editing (`WorkflowBuilder`).
- **ASM-02 [Pending mentor confirmation]**: Introduction of `features/incidents/` containing `IncidentBoard`, `IncidentDrawer`, `WhyAssigned`, `SlaTimer`, and pages `Incidents.tsx` and `IncidentDetails.tsx`.
- **ASM-03 [Pending mentor confirmation]**: Role of Python 3.11+ is focused on the attack/incident simulator (`simulator/`) and the statistical anomaly & coverage analytics service (`analytics/` via FastAPI).
- **ASM-04 [Pending mentor confirmation]**: Monolithic Maven backend with package-by-feature layout (`com.cloudsec.monitor`) instead of a multi-module Maven build.
- **ASM-05 [Pending mentor confirmation]**: Self-signup generates an active `VIEWER` account; promotion to `ANALYST` or `ADMIN` is performed by an existing Administrator.
- **ASM-06 [Pending mentor confirmation]**: Team Lead is represented as a role attribute within a team (`team_members.team_role = 'LEAD'`), rather than a global fourth RBAC role.
- **ASM-07 [Pending mentor confirmation]**: SLA default targets: P1 = 15m, P2 = 60m, P3 = 240m, P4 = 1440m. Escalation trigger thresholds: 25% (Level 1 to Team Lead) and 75% (Level 2 to Admin).
- **ASM-08 [Pending mentor confirmation]**: Dashboard starts with polling (5s interval) with STOMP WebSocket prepared as Phase 5 enhancement.

---

## 3. Technology Stack & Database Decisions
- **DEC-04 [TEAM] Single Database Engine (PostgreSQL 16)**: While SentinelCore references MongoDB and Kafka for SIEM log storage, this phase focuses strictly on Modules 01, 02, 03, and 05; PostgreSQL 16 satisfies all requirements with ACID guarantees and native `jsonb` support.
- **DEC-05 [TEAM] Read-Only Analytics Role**: The Python analytics service connects using a restricted database user (`analytics_ro`) configured with `SELECT`-only permissions on `incidents`, `incident_events`, `shifts`, `team_members`, and `users`.
- **DEC-06 [TEAM] Idempotent Schedulers**: Schedulers running at 30-second intervals for SLA verification and escalation checks verify current database state and log events atomically to prevent duplicate escalation triggers.
