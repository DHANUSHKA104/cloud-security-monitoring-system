-- V1__init.sql: Schema Definition

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sequence for Incident codes: INC-<year>-<number padded to 4 digits>
CREATE SEQUENCE IF NOT EXISTS incident_code_seq START WITH 1 INCREMENT BY 1;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    role VARCHAR(20) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    failed_login_count INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Team members join table
CREATE TABLE team_members (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    team_role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    PRIMARY KEY (team_id, user_id)
);

-- Skills catalog
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE
);

-- User skills mapping (levels 1 to 3)
CREATE TABLE user_skills (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
    level INT NOT NULL CHECK (level >= 1 AND level <= 3),
    PRIMARY KEY (user_id, skill_id)
);

-- Shifts scheduling
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- SLA Policies table
CREATE TABLE sla_policies (
    priority VARCHAR(10) PRIMARY KEY,
    resolve_minutes INT NOT NULL CHECK (resolve_minutes >= 1 AND resolve_minutes <= 10080),
    first_escalation_pct INT NOT NULL CHECK (first_escalation_pct >= 1 AND first_escalation_pct <= 99),
    second_escalation_pct INT NOT NULL CHECK (second_escalation_pct >= 1 AND second_escalation_pct <= 99)
);

-- Incidents table
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(5000),
    priority VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    sla_due_at TIMESTAMPTZ NOT NULL,
    escalation_level INT NOT NULL DEFAULT 0 CHECK (escalation_level >= 0 AND escalation_level <= 2),
    escalated_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assignment_explanation JSONB,
    asset_id VARCHAR(50),
    risk_score INT
);

-- Incident audit timeline events (append-only)
CREATE TABLE incident_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE RESTRICT,
    type VARCHAR(50) NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens for rotation and session revocation
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    replaced_by UUID
);

-- Indexes specified in section 9
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_assignee_id ON incidents(assignee_id);
CREATE INDEX idx_incidents_sla_due_at ON incidents(sla_due_at);
CREATE INDEX idx_incident_events_incident_time ON incident_events(incident_id, created_at);
CREATE INDEX idx_shifts_user_starts ON shifts(user_id, starts_at);
