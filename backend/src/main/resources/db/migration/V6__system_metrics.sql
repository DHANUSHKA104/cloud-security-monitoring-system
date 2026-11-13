CREATE TABLE system_metrics (
    id UUID PRIMARY KEY,
    hostname VARCHAR(255) NOT NULL,
    cpu_percent DOUBLE PRECISION NOT NULL,
    ram_percent DOUBLE PRECISION NOT NULL,
    disk_percent DOUBLE PRECISION NOT NULL,
    disk_drive VARCHAR(100),
    total_ram_bytes BIGINT NOT NULL,
    used_ram_bytes BIGINT NOT NULL,
    total_disk_bytes BIGINT NOT NULL,
    used_disk_bytes BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_system_metrics_recorded_at
    ON system_metrics (recorded_at DESC);
