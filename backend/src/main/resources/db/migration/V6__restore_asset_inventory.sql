-- ============================================================================
-- V4__asset_inventory.sql: Cloud Asset Inventory Schema & Seeding
-- ============================================================================

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL,
    cloud_provider VARCHAR(50) NOT NULL,
    criticality VARCHAR(20) NOT NULL,
    ip_address VARCHAR(50),
    resource_id VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    owner_department VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_code ON assets(code);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_cloud_provider ON assets(cloud_provider);
CREATE INDEX IF NOT EXISTS idx_assets_criticality ON assets(criticality);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_active ON assets(active);

-- Seed standard enterprise demo assets
INSERT INTO assets (id, code, name, type, cloud_provider, criticality, ip_address, resource_id, status, owner_department, active)
VALUES
    (gen_random_uuid(), 'AST-AWS-S3-01', 'Production Data Lake Bucket', 'STORAGE_BUCKET', 'AWS', 'CRITICAL', NULL, 'arn:aws:s3:::prod-customer-data-vault', 'ACTIVE', 'Data Platform', true),
    (gen_random_uuid(), 'AST-AWS-EC2-01', 'Core API Gateway Host', 'VIRTUAL_MACHINE', 'AWS', 'HIGH', '10.0.1.15', 'i-0a1b2c3d4e5f6g7h8', 'ACTIVE', 'Infrastructure', true),
    (gen_random_uuid(), 'AST-GCP-GKE-01', 'Production Microservices Cluster', 'KUBERNETES_CLUSTER', 'GCP', 'CRITICAL', '10.240.0.2', 'projects/cloudsec-prod/clusters/prod-east-1', 'ACTIVE', 'Platform Engineering', true),
    (gen_random_uuid(), 'AST-AZ-SQL-01', 'Billing Database Instance', 'DATABASE_INSTANCE', 'AZURE', 'CRITICAL', '172.16.4.20', '/subscriptions/sub-1/resourceGroups/rg-prod/providers/Microsoft.Sql/servers/sql-billing', 'ACTIVE', 'Finance Operations', true),
    (gen_random_uuid(), 'AST-ONP-DC-01', 'Primary Domain Controller', 'VIRTUAL_MACHINE', 'ON_PREMISE', 'CRITICAL', '192.168.10.5', 'DC-PROD-01', 'ACTIVE', 'IT Security', true)
ON CONFLICT (code) DO NOTHING;

-- Idempotent backfill from distinct existing incidents.asset_id values
INSERT INTO assets (id, code, name, type, cloud_provider, criticality, resource_id, status, active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    i.asset_code,
    i.asset_name,
    i.asset_type,
    i.provider,
    'HIGH',
    i.asset_id,
    'ACTIVE',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT 
        asset_id,
        SUBSTRING(TRIM(asset_id) FROM 1 FOR 50) AS asset_code,
        TRIM(asset_id) AS asset_name,
        CASE 
            WHEN asset_id ILIKE '%s3%' OR asset_id ILIKE '%vault%' THEN 'STORAGE_BUCKET'
            WHEN asset_id ILIKE '%iam%' OR asset_id ILIKE '%role%' THEN 'IAM_ROLE'
            WHEN asset_id ILIKE '%gateway%' OR asset_id ILIKE '%lambda%' THEN 'API_GATEWAY'
            WHEN asset_id ILIKE '%db%' OR asset_id ILIKE '%sql%' THEN 'DATABASE_INSTANCE'
            ELSE 'VIRTUAL_MACHINE'
        END AS asset_type,
        CASE 
            WHEN asset_id ILIKE '%arn:aws%' OR asset_id ILIKE '%cognito%' OR asset_id ILIKE '%lambda%' THEN 'AWS'
            WHEN asset_id ILIKE '%gcp%' THEN 'GCP'
            WHEN asset_id ILIKE '%azure%' THEN 'AZURE'
            ELSE 'ON_PREMISE'
        END AS provider
    FROM incidents 
    WHERE asset_id IS NOT NULL AND TRIM(asset_id) <> ''
) i
WHERE NOT EXISTS (
    SELECT 1 FROM assets a WHERE a.code = i.asset_code
)
ON CONFLICT (code) DO NOTHING;

-- Grant analytics read-only access
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'analytics_ro') THEN
        GRANT SELECT ON assets TO analytics_ro;
    END IF;
END $$;
