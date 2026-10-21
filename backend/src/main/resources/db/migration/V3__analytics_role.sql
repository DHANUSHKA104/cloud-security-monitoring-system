-- V3__analytics_role.sql: Read-only Role for Python Analytics Service

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'analytics_ro') THEN
        CREATE ROLE analytics_ro WITH LOGIN PASSWORD '${analyticsDbPassword}';
    ELSE
        ALTER ROLE analytics_ro WITH PASSWORD '${analyticsDbPassword}';
    END IF;
END $$;

-- Grant SELECT-only privileges on tables read by Python analytics service
GRANT SELECT ON incidents TO analytics_ro;
GRANT SELECT ON incident_events TO analytics_ro;
GRANT SELECT ON shifts TO analytics_ro;
GRANT SELECT ON team_members TO analytics_ro;
GRANT SELECT ON users TO analytics_ro;
