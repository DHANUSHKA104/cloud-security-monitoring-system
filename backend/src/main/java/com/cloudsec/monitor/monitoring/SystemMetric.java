package com.cloudsec.monitor.monitoring;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "system_metrics")
public class SystemMetric {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String hostname;

    @Column(name = "cpu_percent", nullable = false)
    private double cpuPercent;

    @Column(name = "ram_percent", nullable = false)
    private double ramPercent;

    @Column(name = "disk_percent", nullable = false)
    private double diskPercent;

    @Column(name = "disk_drive", length = 100)
    private String diskDrive;

    @Column(name = "total_ram_bytes", nullable = false)
    private long totalRamBytes;

    @Column(name = "used_ram_bytes", nullable = false)
    private long usedRamBytes;

    @Column(name = "total_disk_bytes", nullable = false)
    private long totalDiskBytes;

    @Column(name = "used_disk_bytes", nullable = false)
    private long usedDiskBytes;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    public SystemMetric() {}

    @PrePersist
    protected void onCreate() {
        if (recordedAt == null) recordedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getHostname() { return hostname; }
    public void setHostname(String hostname) { this.hostname = hostname; }
    public double getCpuPercent() { return cpuPercent; }
    public void setCpuPercent(double cpuPercent) { this.cpuPercent = cpuPercent; }
    public double getRamPercent() { return ramPercent; }
    public void setRamPercent(double ramPercent) { this.ramPercent = ramPercent; }
    public double getDiskPercent() { return diskPercent; }
    public void setDiskPercent(double diskPercent) { this.diskPercent = diskPercent; }
    public String getDiskDrive() { return diskDrive; }
    public void setDiskDrive(String diskDrive) { this.diskDrive = diskDrive; }
    public long getTotalRamBytes() { return totalRamBytes; }
    public void setTotalRamBytes(long totalRamBytes) { this.totalRamBytes = totalRamBytes; }
    public long getUsedRamBytes() { return usedRamBytes; }
    public void setUsedRamBytes(long usedRamBytes) { this.usedRamBytes = usedRamBytes; }
    public long getTotalDiskBytes() { return totalDiskBytes; }
    public void setTotalDiskBytes(long totalDiskBytes) { this.totalDiskBytes = totalDiskBytes; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getRecordedAt() { return recordedAt; }
}
