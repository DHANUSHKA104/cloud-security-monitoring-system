-- ============================================================================
-- V5__response_playbooks.sql: Guided Incident Response Playbooks Schema & Seeding
-- ============================================================================

CREATE TABLE IF NOT EXISTS playbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_playbooks_code ON playbooks(code);
CREATE INDEX IF NOT EXISTS idx_playbooks_category ON playbooks(category);
CREATE INDEX IF NOT EXISTS idx_playbooks_active ON playbooks(active);

CREATE TABLE IF NOT EXISTS playbook_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE RESTRICT,
    step_order INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    instructions TEXT NOT NULL,
    action_type VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
    risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_playbook_step_order UNIQUE (playbook_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_playbook_steps_playbook_id ON playbook_steps(playbook_id);

CREATE TABLE IF NOT EXISTS incident_playbook_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE RESTRICT,
    playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE RESTRICT,
    step_id UUID NOT NULL REFERENCES playbook_steps(id) ON DELETE RESTRICT,
    executed_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    notes TEXT,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_incident_step_exec UNIQUE (incident_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_incident_playbook_executions_incident ON incident_playbook_executions(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_playbook_executions_playbook ON incident_playbook_executions(playbook_id);
CREATE INDEX IF NOT EXISTS idx_incident_playbook_executions_step ON incident_playbook_executions(step_id);

-- Idempotent Playbook Seeding for all 7 Categories
INSERT INTO playbooks (id, code, title, category, description, active)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'PB-AUTH-01', 'Authentication Attack Response SOP', 'AUTH_ATTACK', 'Standard response procedure for brute force, credential stuffing, and unauthorized IAM token generation.', true),
    ('b0000000-0000-0000-0000-000000000002', 'PB-DATA-01', 'Data Exposure & Exfiltration SOP', 'DATA_EXPOSURE', 'Rapid containment and forensic isolation workflow for egress anomalies and public cloud bucket leaks.', true),
    ('b0000000-0000-0000-0000-000000000003', 'PB-MALW-01', 'Host Ransomware & Malware Containment SOP', 'MALWARE', 'Emergency host isolation, volatile memory dump, and binary hash quarantine procedures.', true),
    ('b0000000-0000-0000-0000-000000000004', 'PB-NETW-01', 'Network Intrusion & Port Sweep Containment', 'NETWORK_INTRUSION', 'Network boundary firewall enforcement, VPC flow log triage, and source IP rate limiting.', true),
    ('b0000000-0000-0000-0000-000000000005', 'PB-CFG-01', 'Cloud Infrastructure Misconfiguration SOP', 'CLOUD_MISCONFIG', 'Automated security group remediation, public ACL revocation, and compliance audit.', true),
    ('b0000000-0000-0000-0000-000000000006', 'PB-POL-01', 'Enterprise Security Policy Violation SOP', 'POLICY_VIOLATION', 'User privilege suspension, manager notification, and compliance audit trail capture.', true),
    ('b0000000-0000-0000-0000-000000000007', 'PB-OTHR-01', 'General Security Incident Triage SOP', 'OTHER', 'Universal triage procedure for anomalous security events without predefined category.', true)
ON CONFLICT (code) DO NOTHING;

-- Idempotent Playbook Step Seeding
-- PB-AUTH-01 Steps
INSERT INTO playbook_steps (id, playbook_id, step_order, name, instructions, action_type, risk_level)
VALUES
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 1, 'Verify Authentication Source & Target', 'Inspect user-agent, source IP geolocation, and verify whether targeted principal has administrative privileges.', 'MANUAL', 'LOW'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 2, 'Revoke Active Sessions & Rotate Secret', 'Execute immediate token revocation across IdP / Cognito and invalidate session cookies.', 'AUTOMATED_SIMULATED', 'MEDIUM'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 3, 'Block Offending IP on WAF', 'Apply dynamic ingress deny rule to edge CloudFront/API Gateway for the offending CIDR.', 'AUTOMATED_SIMULATED', 'HIGH'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 4, 'Notify Target User & Validate Out-of-Band', 'Contact user via verified secondary channel to confirm anomalous authentication attempt.', 'VERIFICATION', 'LOW')
ON CONFLICT (playbook_id, step_order) DO NOTHING;

-- PB-DATA-01 Steps
INSERT INTO playbook_steps (id, playbook_id, step_order, name, instructions, action_type, risk_level)
VALUES
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 1, 'Analyze Egress Destination & Volume', 'Verify external IP ownership via WHOIS and assess classification of affected data assets.', 'MANUAL', 'LOW'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 2, 'Enforce S3 / Storage Bucket Private ACL', 'Apply restrictive bucket policy denying public GET and restricting egress to authorized VPC endpoint only.', 'AUTOMATED_SIMULATED', 'MEDIUM'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 3, 'Sever Cloud Storage IAM Access', 'Attach AWS DenyAll inline policy to compromised instance IAM role or access key.', 'AUTOMATED_SIMULATED', 'HIGH'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 4, 'Verify Data Exfiltration Cessation', 'Audit real-time CloudWatch VPC Flow Logs / Azure Network Watcher to confirm zero active bytes egressing.', 'VERIFICATION', 'LOW')
ON CONFLICT (playbook_id, step_order) DO NOTHING;

-- PB-MALW-01 Steps
INSERT INTO playbook_steps (id, playbook_id, step_order, name, instructions, action_type, risk_level)
VALUES
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000003', 1, 'Network Isolation of Compromised Node', 'Modify cloud security group to isolate instance into sandbox quarantine VLAN.', 'AUTOMATED_SIMULATED', 'HIGH'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000003', 2, 'Acquire Volatile RAM & Disk Snapshot', 'Trigger EBS volume snapshot and capture memory dump for forensics prior to power off.', 'AUTOMATED_SIMULATED', 'MEDIUM'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000003', 3, 'Correlate Process & Binary Hashes', 'Cross-reference suspicious execution binaries with VirusTotal and threat intelligence feeds.', 'MANUAL', 'LOW'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000003', 4, 'Post-Incident Cleanliness Verification', 'Verify no persistence scheduled tasks, crontabs, or unauthorized SSH authorized_keys remain.', 'VERIFICATION', 'LOW')
ON CONFLICT (playbook_id, step_order) DO NOTHING;

-- PB-NETW-01 Steps
INSERT INTO playbook_steps (id, playbook_id, step_order, name, instructions, action_type, risk_level)
VALUES
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000004', 1, 'Trace Intrusion Vector & Target Subnet', 'Review firewall state tables to determine swept ports and potential lateral movement.', 'MANUAL', 'LOW'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000004', 2, 'Deploy Edge Network ACL Drop Rule', 'Insert stateless Network ACL deny rule at VPC subnet boundary.', 'AUTOMATED_SIMULATED', 'MEDIUM'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000004', 3, 'Validate Boundary Containment', 'Run automated perimeter probe to ensure port scanner traffic is dropped.', 'VERIFICATION', 'LOW')
ON CONFLICT (playbook_id, step_order) DO NOTHING;

-- PB-CFG-01 Steps
INSERT INTO playbook_steps (id, playbook_id, step_order, name, instructions, action_type, risk_level)
VALUES
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000005', 1, 'Inspect Modified Security Group / IAM Policy', 'Review AWS CloudTrail / GCP Audit Log to locate principal that initiated misconfiguration.', 'MANUAL', 'LOW'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000005', 2, 'Auto-Rollback to Known Good Baseline', 'Re-apply Terraform/CloudFormation desired state baseline to close open ingress ports (0.0.0.0/0).', 'AUTOMATED_SIMULATED', 'MEDIUM'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000005', 3, 'Verify Compliance Audit Rule', 'Execute AWS Config / GCP Security Command Center rule to verify compliance restored.', 'VERIFICATION', 'LOW')
ON CONFLICT (playbook_id, step_order) DO NOTHING;

-- PB-POL-01 Steps
INSERT INTO playbook_steps (id, playbook_id, step_order, name, instructions, action_type, risk_level)
VALUES
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000006', 1, 'Audit Policy Violation Evidence', 'Collect access log excerpts demonstrating compliance or policy breach.', 'MANUAL', 'LOW'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000006', 2, 'Restrict Elevated Privileges', 'Temporarily downgrade user from elevated role to baseline VIEWER role.', 'AUTOMATED_SIMULATED', 'MEDIUM'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000006', 3, 'Notify SOC Management & User', 'Dispatch audit alert to compliance lead and employee manager.', 'VERIFICATION', 'LOW')
ON CONFLICT (playbook_id, step_order) DO NOTHING;

-- PB-OTHR-01 Steps
INSERT INTO playbook_steps (id, playbook_id, step_order, name, instructions, action_type, risk_level)
VALUES
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000007', 1, 'Initial Triage & Impact Assessment', 'Examine alert telemetry, target system criticality, and determine proper escalation path.', 'MANUAL', 'LOW'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000007', 2, 'Classify and Re-categorize Incident', 'Assign specific incident category and priority based on established SOC triage matrices.', 'MANUAL', 'LOW'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000007', 3, 'Confirm Containment and Log Incident Notes', 'Document all investigative findings and verify system stability before resolution.', 'VERIFICATION', 'LOW')
ON CONFLICT (playbook_id, step_order) DO NOTHING;

-- Grant analytics read-only access
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'analytics_ro') THEN
        GRANT SELECT ON playbooks TO analytics_ro;
        GRANT SELECT ON playbook_steps TO analytics_ro;
        GRANT SELECT ON incident_playbook_executions TO analytics_ro;
    END IF;
END $$;
