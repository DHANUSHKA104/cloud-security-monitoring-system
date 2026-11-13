package com.cloudsecurity;

import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import oshi.hardware.GlobalMemory;
import oshi.hardware.HardwareAbstractionLayer;
import oshi.software.os.OperatingSystem;

import java.io.File;
import java.net.InetAddress;
import java.sql.SQLException;

/**
 * MonitoringService is responsible for querying real system hardware metrics
 * using the OSHI (Operating System and Hardware Information) library,
 * applying configurable threshold rules, and coordinating with DatabaseManager.
 */
public class MonitoringService {

    // Configurable thresholds for demonstration purposes
    // Note: These are example baseline thresholds for project demonstration,
    // not universal security detection rules.
    private double cpuThresholdPercent = 80.0;
    private double ramThresholdPercent = 80.0;
    private double diskThresholdPercent = 90.0;

    private final SystemInfo systemInfo;
    private final CentralProcessor processor;
    private final GlobalMemory memory;
    private final OperatingSystem operatingSystem;
    private String cachedHostName;

    /**
     * Initializes OSHI system hardware probes.
     */
    public MonitoringService() {
        this.systemInfo = new SystemInfo();
        HardwareAbstractionLayer hardware = systemInfo.getHardware();
        this.processor = hardware.getProcessor();
        this.memory = hardware.getMemory();
        this.operatingSystem = systemInfo.getOperatingSystem();
        this.cachedHostName = resolveHostName();
    }

    /**
     * Safely detects the machine hostname from OSHI or Java standard networking.
     */
    private String resolveHostName() {
        try {
            if (operatingSystem != null && operatingSystem.getNetworkParams() != null) {
                String host = operatingSystem.getNetworkParams().getHostName();
                if (host != null && !host.isBlank()) {
                    return host;
                }
            }
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "localhost";
        }
    }

    /**
     * Collects actual current system metrics:
     * - CPU load over a 1000ms measurement window.
     * - Physical RAM total, available, and used.
     * - Primary disk root storage (total, used, percentage).
     *
     * @return A populated SystemMetrics snapshot.
     */
    public SystemMetrics collectCurrentMetrics() {
        // 1. CPU Usage
        // getSystemCpuLoad(1000L) samples CPU ticks over 1 second (1000 milliseconds)
        double cpuLoad = processor.getSystemCpuLoad(1000L) * 100.0;
        if (cpuLoad < 0.0) {
            cpuLoad = 0.0;
        }

        // 2. RAM Usage
        long totalRam = memory.getTotal();
        long availableRam = memory.getAvailable();
        long usedRam = Math.max(0, totalRam - availableRam);
        double ramPercent = totalRam > 0 ? ((double) usedRam / totalRam) * 100.0 : 0.0;

        // 3. Disk Usage (Primary Root Drive, e.g. C:\)
        String driveName = "C:\\";
        long totalDisk = 0;
        long usedDisk = 0;
        double diskPercent = 0.0;

        File[] roots = File.listRoots();
        if (roots != null && roots.length > 0) {
            File primaryDrive = roots[0];
            driveName = primaryDrive.getAbsolutePath();
            totalDisk = primaryDrive.getTotalSpace();
            long usableDisk = primaryDrive.getUsableSpace();
            usedDisk = Math.max(0, totalDisk - usableDisk);
            if (totalDisk > 0) {
                diskPercent = ((double) usedDisk / totalDisk) * 100.0;
            }
        }

        // 4. Rule-based evaluation
        String status = evaluateStatus(cpuLoad, ramPercent, diskPercent);

        return new SystemMetrics(
                cachedHostName,
                cpuLoad,
                ramPercent,
                diskPercent,
                driveName,
                totalRam,
                usedRam,
                totalDisk,
                usedDisk,
                status
        );
    }

    /**
     * Evaluates collected metrics against configurable demonstration thresholds.
     *
     * @param cpu  Current CPU utilization percentage
     * @param ram  Current RAM utilization percentage
     * @param disk Current Disk utilization percentage
     * @return "HIGH_USAGE" if any threshold is exceeded, otherwise "NORMAL"
     */
    public String evaluateStatus(double cpu, double ram, double disk) {
        if (cpu >= cpuThresholdPercent || ram >= ramThresholdPercent || disk >= diskThresholdPercent) {
            return "HIGH_USAGE";
        }
        return "NORMAL";
    }

    /**
     * Executes an automated monitoring cycle collecting a specified number of readings,
     * printing each reading in real time, and persisting it to the SQLite database.
     *
     * @param count          Number of readings to collect (e.g. 5)
     * @param intervalMillis Delay between consecutive readings in milliseconds
     * @param dbManager      The DatabaseManager used to store the readings
     */
    public void runMonitoringCycle(int count, long intervalMillis, DatabaseManager dbManager) {
        System.out.printf("%n[INFO] Starting monitoring cycle: collecting %d readings (Interval: %d ms)...%n",
                count, intervalMillis);
        System.out.println("-----------------------------------------------------------------------------------------");

        for (int i = 1; i <= count; i++) {
            try {
                System.out.printf("[Sample %d/%d] Sampling system hardware... ", i, count);
                System.out.flush();

                // Collect metrics (takes ~1000ms for CPU tick sampling)
                SystemMetrics reading = collectCurrentMetrics();

                // Save to SQLite database
                int generatedId = dbManager.saveMetrics(reading);

                // Print the reading with status indicator
                String statusTag = reading.getStatus().equals("HIGH_USAGE") ? "[!] HIGH_USAGE" : "[OK] NORMAL";
                System.out.printf("Saved ID #%-2d | CPU: %5.2f%% | RAM: %5.2f%% | Disk: %5.2f%% | %s%n",
                        generatedId,
                        reading.getCpuPercent(),
                        reading.getRamPercent(),
                        reading.getDiskPercent(),
                        statusTag);

                // Pause before next reading (except after the final reading)
                if (i < count && intervalMillis > 0) {
                    Thread.sleep(intervalMillis);
                }

            } catch (SQLException e) {
                System.err.printf("%n[ERROR] Database write failed on reading %d: %s%n", i, e.getMessage());
            } catch (InterruptedException e) {
                System.err.println("\n[WARN] Monitoring loop interrupted.");
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                System.err.printf("%n[ERROR] Unexpected error during collection: %s%n", e.getMessage());
            }
        }

        System.out.println("-----------------------------------------------------------------------------------------");
        System.out.println("[INFO] Monitoring cycle completed successfully.");
    }

    // Threshold Getters and Setters
    public double getCpuThresholdPercent() {
        return cpuThresholdPercent;
    }

    public void setCpuThresholdPercent(double cpuThresholdPercent) {
        this.cpuThresholdPercent = cpuThresholdPercent;
    }

    public double getRamThresholdPercent() {
        return ramThresholdPercent;
    }

    public void setRamThresholdPercent(double ramThresholdPercent) {
        this.ramThresholdPercent = ramThresholdPercent;
    }

    public double getDiskThresholdPercent() {
        return diskThresholdPercent;
    }

    public void setDiskThresholdPercent(double diskThresholdPercent) {
        this.diskThresholdPercent = diskThresholdPercent;
    }
}
