-- V2__reference_data.sql: Default SLA Policies and Core Skills Catalog

-- SLA Policies (P1: 15m, P2: 60m, P3: 240m, P4: 1440m)
INSERT INTO sla_policies (priority, resolve_minutes, first_escalation_pct, second_escalation_pct)
VALUES
    ('P1', 15, 25, 75),
    ('P2', 60, 25, 75),
    ('P3', 240, 25, 75),
    ('P4', 1440, 25, 75)
ON CONFLICT (priority) DO UPDATE SET
    resolve_minutes = EXCLUDED.resolve_minutes,
    first_escalation_pct = EXCLUDED.first_escalation_pct,
    second_escalation_pct = EXCLUDED.second_escalation_pct;

-- Core SOC Skills Catalog
INSERT INTO skills (id, name)
VALUES
    (gen_random_uuid(), 'auth-forensics'),
    (gen_random_uuid(), 'malware-analysis'),
    (gen_random_uuid(), 'data-protection'),
    (gen_random_uuid(), 'network-forensics'),
    (gen_random_uuid(), 'compliance'),
    (gen_random_uuid(), 'cloud-iam'),
    (gen_random_uuid(), 'incident-response'),
    (gen_random_uuid(), 'log-analysis')
ON CONFLICT (name) DO NOTHING;
