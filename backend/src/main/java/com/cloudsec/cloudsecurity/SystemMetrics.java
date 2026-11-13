package com.cloudsecurity;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * SystemMetrics is a Data Transfer Object (DTO) / model class.
 * It holds a single snapshot of system resource utilization (CPU, RAM, Disk)
 * along with metadata like the hostname, timestamp, and security status.
 */
public class SystemMetrics {

    private int id;
    private String recordedAt;
    private String hostName;
    private double cpuPercent;
    private double ramPercent;
    private double diskPercent;
    private String diskDrive;
    private long totalRamBytes;
    private long usedRamBytes;
    private long availableRamBytes;
    private long totalDiskBytes;
    private long usedDiskBytes;
    private String status; // "NORMAL" or "HIGH_USAGE"

    // Default constructor
    public SystemMetrics() {
        this.recordedAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    // Parameterized constructor for easy initialization
    public SystemMetrics(String hostName, double cpuPercent, double ramPercent,
                         double diskPercent, String diskDrive,
                         long totalRamBytes, long usedRamBytes,
                         long totalDiskBytes, long usedDiskBytes,
                         String status) {
        this();
        this.hostName = hostName;
        this.cpuPercent = roundTwoDecimals(cpuPercent);
        this.ramPercent = roundTwoDecimals(ramPercent);
        this.diskPercent = roundTwoDecimals(diskPercent);
        this.diskDrive = diskDrive;
        this.totalRamBytes = totalRamBytes;
        this.usedRamBytes = usedRamBytes;
        this.availableRamBytes = totalRamBytes - usedRamBytes;
        this.totalDiskBytes = totalDiskBytes;
        this.usedDiskBytes = usedDiskBytes;
        this.status = status;
    }

    // Helper method to round values to 2 decimal places for clean display
    public static double roundTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    // Helper method to convert raw bytes to gigabytes (GB)
    public double getRamTotalGb() {
        return roundTwoDecimals((double) totalRamBytes / (1024 * 1024 * 1024));
    }

    public double getRamUsedGb() {
        return roundTwoDecimals((double) usedRamBytes / (1024 * 1024 * 1024));
    }

    public double getDiskTotalGb() {
        return roundTwoDecimals((double) totalDiskBytes / (1024 * 1024 * 1024));
    }

    public double getDiskUsedGb() {
        return roundTwoDecimals((double) usedDiskBytes / (1024 * 1024 * 1024));
    }

    // Getters and Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(String recordedAt) {
        this.recordedAt = recordedAt;
    }

    public String getHostName() {
        return hostName;
    }

    public void setHostName(String hostName) {
        this.hostName = hostName;
    }

    public double getCpuPercent() {
        return cpuPercent;
    }

    public void setCpuPercent(double cpuPercent) {
        this.cpuPercent = roundTwoDecimals(cpuPercent);
    }

    public double getRamPercent() {
        return ramPercent;
    }

    public void setRamPercent(double ramPercent) {
        this.ramPercent = roundTwoDecimals(ramPercent);
    }

    public double getDiskPercent() {
        return diskPercent;
    }

    public void setDiskPercent(double diskPercent) {
        this.diskPercent = roundTwoDecimals(diskPercent);
    }

    public String getDiskDrive() {
        return diskDrive;
    }

    public void setDiskDrive(String diskDrive) {
        this.diskDrive = diskDrive;
    }

    public long getTotalRamBytes() {
        return totalRamBytes;
    }

    public void setTotalRamBytes(long totalRamBytes) {
        this.totalRamBytes = totalRamBytes;
    }

    public long getUsedRamBytes() {
        return usedRamBytes;
    }

    public void setUsedRamBytes(long usedRamBytes) {
        this.usedRamBytes = usedRamBytes;
    }

    public long getAvailableRamBytes() {
        return availableRamBytes;
    }

    public void setAvailableRamBytes(long availableRamBytes) {
        this.availableRamBytes = availableRamBytes;
    }

    public long getTotalDiskBytes() {
        return totalDiskBytes;
    }

    public void setTotalDiskBytes(long totalDiskBytes) {
        this.totalDiskBytes = totalDiskBytes;
    }

    public long getUsedDiskBytes() {
        return usedDiskBytes;
    }

    public void setUsedDiskBytes(long usedDiskBytes) {
        this.usedDiskBytes = usedDiskBytes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @Override
    public String toString() {
        return String.format("[%s] Host: %s | CPU: %.2f%% | RAM: %.2f%% (%.2f/%.2f GB) | Disk (%s): %.2f%% (%.2f/%.2f GB) | Status: %s",
                recordedAt, hostName, cpuPercent, ramPercent, getRamUsedGb(), getRamTotalGb(),
                diskDrive, diskPercent, getDiskUsedGb(), getDiskTotalGb(), status);
    }
}
