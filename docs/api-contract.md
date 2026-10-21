# API Contract: Cloud Security Monitoring System

**Version:** 1.1  
**Base Path:** `/api`  
**Conventions:**
- Format: JSON
- Field naming: `camelCase`
- Enum values: Upper-case strings
- Timestamps: ISO-8601 UTC (e.g., `2026-10-19T10:30:00Z`)
- Authorization Header: `Bearer <accessToken>` on all authenticated endpoints.
- Pagination format: `?page=0&size=20&sort=createdAt,desc`
  - Page response shape: `{ "content": [...], "page": 0, "size": 20, "totalElements": 100, "totalPages": 5 }`

---

## Standard Error Response Shape
Every API error adheres strictly to this structure:
```json
{
  "timestamp": "2026-10-19T10:32:00Z",
  "status": 409,
  "error": "Conflict",
  "code": "CONFLICT",
  "message": "An incident cannot move from OPEN to RESOLVED",
  "path": "/api/incidents/0c9a7e55-3b21-4f6d-a8c4-91d2e5f7b3a2/status",
  "details": []
}
```

### Error Codes
- `400`: `VALIDATION_ERROR`
- `401`: `UNAUTHENTICATED`
- `403`: `FORBIDDEN`
- `404`: `NOT_FOUND`
- `409`: `CONFLICT`
- `423`: `ACCOUNT_LOCKED`
- `500`: `INTERNAL_ERROR`

---

## 1. Authentication (`/api/auth`)

| Method | Path | Access | Description / Payload |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Body: `{ "email", "password", "fullName" }`. Creates a user with role `VIEWER`. |
| `POST` | `/api/auth/login` | Public | Body: `{ "email", "password" }`. Returns `{ accessToken, expiresIn, user }` or `{ mfaRequired: true, mfaToken }`. Sets HttpOnly refresh token cookie. |
| `POST` | `/api/auth/mfa/verify` | Public | Body: `{ "mfaToken", "code" }`. Completes login after MFA challenge. |
| `POST` | `/api/auth/refresh` | Cookie | Reads HttpOnly `refresh_token` cookie; rotates cookie and returns a new access token. |
| `POST` | `/api/auth/logout` | Authenticated | Revokes current refresh token chain and clears cookie. |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated `UserPrincipal` profile. |
| `POST` | `/api/auth/mfa/enable` | Authenticated | Enables MFA for caller's own account. |
| `POST` | `/api/auth/mfa/disable` | Authenticated | Disables MFA for caller's own account. |
| `POST` | `/api/auth/change-password` | Authenticated | Body: `{ "currentPassword", "newPassword" }`. |

---

## 2. Users, Teams, Skills & Shifts (`/api/*`)

| Method | Path | Access | Description / Notes |
|---|---|---|---|
| `GET` | `/api/users` | Admin | Query: `q`, `role`, `active`, `page`, `size`. Paged user response. |
| `POST` | `/api/users` | Admin | Body: `{ "email", "fullName", "department", "role", "password" }`. |
| `GET` | `/api/users/{id}` | Admin or Self | Includes skills and assigned teams. |
| `PATCH` | `/api/users/{id}` | Admin | Body: `{ "fullName", "department", "role", "active" }` (Soft deactivation). |
| `PUT` | `/api/users/{id}/skills` | Admin | Body: `[{ "skillId", "level" }]` (Levels 1 to 3). |
| `GET` | `/api/teams` | Authenticated | List all active teams. |
| `POST` | `/api/teams` | Admin | Body: `{ "name", "description" }`. |
| `PATCH` | `/api/teams/{id}` | Admin | Body: `{ "name", "description" }`. |
| `GET` | `/api/teams/{id}/members` | Authenticated | List members of specified team. |
| `PUT` | `/api/teams/{id}/members/{userId}` | Admin | Body: `{ "teamRole": "MEMBER" \| "LEAD" }`. |
| `DELETE` | `/api/teams/{id}/members/{userId}` | Admin | Removes user from team. |
| `GET` | `/api/skills` | Authenticated | List available skills. |
| `POST` | `/api/skills` | Admin | Body: `{ "name" }`. |
| `GET` | `/api/shifts` | Authenticated | Query: `userId`, `from`, `to`. |
| `POST` | `/api/shifts` | Admin | Body: `{ "userId", "startsAt", "endsAt" }`. |
| `DELETE` | `/api/shifts/{id}` | Admin | Delete scheduled shift. |
| `GET` | `/api/shifts/on-now` | Authenticated | Query: `teamId` (optional). Returns analysts actively on shift (`startsAt <= now < endsAt`). |
| `GET` | `/api/shifts/handover` | Admin, Analyst | Query: `teamId`. Structured shift handover brief + templated text. |

---

## 3. Incidents & SLA (`/api/incidents`, `/api/sla-policies`)

| Method | Path | Access | Description / Notes |
|---|---|---|---|
| `GET` | `/api/incidents` | Authenticated | Query: `status`, `priority`, `category`, `assigneeId`, `teamId`, `slaState`, `escalatedToMe`, `q`, `page`, `size`. |
| `POST` | `/api/incidents` | Admin, Analyst | Body: `{ "title", "description", "priority", "category", "teamId" }`. Returns `201 Created` with automatic assignment. |
| `GET` | `/api/incidents/{id}` | Authenticated | Full incident details with assignment explanation and SLA timer metrics. |
| `PATCH` | `/api/incidents/{id}/status` | Permitted Roles | Body: `{ "status", "note" }`. Transitions: OPEN -> TRIAGED -> IN_PROGRESS -> RESOLVED -> CLOSED. |
| `POST` | `/api/incidents/{id}/assign` | Admin, Team Lead | Body: `{ "assigneeId", "reason" }`. Manually reassign incident. |
| `POST` | `/api/incidents/{id}/escalate` | Admin, Team Lead | Body: `{ "toUserId", "reason" }`. Manually escalate incident. |
| `POST` | `/api/incidents/{id}/comments` | Permitted Roles | Body: `{ "text" }`. Appends comment to incident. |
| `POST` | `/api/incidents/{id}/reopen` | Admin, Team Lead | Body: `{ "reason" }`. Transitions RESOLVED back to IN_PROGRESS. |
| `GET` | `/api/incidents/{id}/timeline` | Authenticated | Chronological audit events (`oldest` first). |
| `GET` | `/api/sla-policies` | Authenticated | List SLA configurations (P1, P2, P3, P4). |
| `PUT` | `/api/sla-policies/{priority}` | Admin | Body: `{ "resolveMinutes", "firstEscalationPct", "secondEscalationPct" }`. |

### Full Incident Response Shape
```json
{
  "id": "0c9a7e55-3b21-4f6d-a8c4-91d2e5f7b3a2",
  "code": "INC-2026-0042",
  "title": "Repeated failed logins on admin account",
  "description": "17 failed attempts from 3 addresses within 2 minutes",
  "priority": "P1",
  "status": "OPEN",
  "category": "AUTH_ATTACK",
  "teamId": "5d2e9f10-6a7b-4c3d-8e1f-2a9b0c4d7e61",
  "assignee": {
    "id": "b3f1c2a4-0d5e-4c1a-9a3b-7e2f6d8c1a90",
    "fullName": "Priya Nair"
  },
  "createdAt": "2026-10-19T10:30:00Z",
  "acknowledgedAt": null,
  "resolvedAt": null,
  "slaDueAt": "2026-10-19T10:45:00Z",
  "slaState": "ON_TRACK",
  "timeRemainingSeconds": 900,
  "escalationLevel": 0,
  "escalatedTo": null,
  "assignmentExplanation": {
    "winner": "b3f1c2a4-0d5e-4c1a-9a3b-7e2f6d8c1a90",
    "noCoverage": false,
    "candidates": [
      {
        "userId": "b3f1c2a4-0d5e-4c1a-9a3b-7e2f6d8c1a90",
        "fullName": "Priya Nair",
        "skill": 40,
        "workload": 30,
        "history": 8,
        "runway": 10,
        "total": 88
      }
    ]
  }
}
```

---

## 4. Security Dashboard & Analytics (`/api/dashboard/*`)

| Method | Path | Access | Returns |
|---|---|---|---|
| `GET` | `/api/dashboard/summary` | Authenticated | Summary counts: `{ openIncidents, p1Open, threatScore, threatLevel, slaCompliancePct, mttrMinutes, atRiskCount, breachedCount }`. |
| `GET` | `/api/dashboard/trends` | Authenticated | Trend series: `{ daily: [...], hourly: [...], byPriority: [...] }`. |
| `GET` | `/api/dashboard/workload` | Authenticated | List per analyst: `{ userId, fullName, openCount, weightedLoad, byPriority: { P1, P2, P3, P4 } }`. |
| `GET` | `/api/dashboard/at-risk` | Authenticated | List of incidents sorted by remaining time until SLA breach. |
| `GET` | `/api/dashboard/feed` | Authenticated | Query `limit=30`. Latest incident events. |
| `GET` | `/api/dashboard/insights` | Authenticated | Insights from Python analytics service: `{ available: true, volumeAnomalies: [...], coverageGaps: [...], resolutionStats: [...] }`. |

---

## 5. Dev & Simulator Endpoints (Dev Profile Only, Header `X-Sim-Key`)

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/sim/incidents` | Simulator Key | Ingest live simulation incidents. |
| `POST` | `/api/sim/seed` | Simulator Key | Ingest historical resolved incident seed data. |
| `POST` | `/api/demo/reset` | Simulator Key / Dev | Restore database to clean demo state. |
