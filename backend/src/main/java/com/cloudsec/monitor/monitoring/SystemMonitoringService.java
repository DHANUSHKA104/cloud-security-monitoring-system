package com.cloudsec.monitor.monitoring;

import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import oshi.hardware.GlobalMemory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.net.InetAddress;

@Service
public class SystemMonitoringService {
    private static final double CPU_THRESHOLD = 80.0;
    private static final double RAM_THRESHOLD = 80.0;
    private static final double DISK_THRESHOLD = 90.0;

    private final SystemMetricRepository repository;
    private final CentralProcessor processor;
    private final GlobalMemory memory;

    public SystemMonitoringService(SystemMetricRepository repository) {
        SystemInfo systemInfo = new SystemInfo();
        this.processor = systemInfo.getHardware().getProcessor();
        this.memory = systemInfo.getHardware().getMemory();
        this.repository = repository;
    }

    @Transactional
    public SystemMetric collectAndSave() {
        double cpu = processor.getSystemCpuLoad(1000L) * 100.0;
        cpu = clamp(cpu);

        long totalRam = memory.getTotal();
        long usedRam = Math.max(0L, totalRam - memory.getAvailable());
        double ram = totalRam > 0 ? (usedRam * 100.0 / totalRam) : 0.0;

        String drive = null;
        long totalDisk = 0L;
        long usedDisk = 0L;
        File[] roots = File.listRoots();
        if (roots != null && roots.length > 0) {
            File root = roots[0];
            drive = root.getAbsolutePath();
            totalDisk = Math.max(0L, root.getTotalSpace());
            usedDisk = Math.max(0L, totalDisk - root.getUsableSpace());
        }
        double disk = totalDisk > 0 ? (usedDisk * 100.0 / totalDisk) : 0.0;

        SystemMetric metric = new SystemMetric();
        metric.setHostname(resolveHostname());
        metric.setCpuPercent(round(cpu));
        metric.setRamPercent(round(ram));
        metric.setDiskPercent(round(disk));
        metric.setDiskDrive(drive);
        metric.setTotalRamBytes(totalRam);
        metric.setUsedRamBytes(usedRam);
        metric.setTotalDiskBytes(totalDisk);
        metric.setUsedDiskBytes(usedDisk);
        metric.setStatus(
            cpu >= CPU_THRESHOLD || ram >= RAM_THRESHOLD || disk >= DISK_THRESHOLD
                ? "HIGH_USAGE" : "NORMAL"
        );

        return repository.save(metric);
    }

    private String resolveHostname() {
        try {
            String hostname = InetAddress.getLocalHost().getHostName();
            return (hostname == null || hostname.isBlank()) ? "unknown" : hostname;
        } catch (Exception exception) {
            return "unknown";
        }
    }

    private double clamp(double value) {
        if (Double.isNaN(value) || value < 0.0) return 0.0;
        return Math.min(value, 100.0);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
