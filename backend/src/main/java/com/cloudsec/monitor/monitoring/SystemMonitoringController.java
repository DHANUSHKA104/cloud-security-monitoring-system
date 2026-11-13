package com.cloudsec.monitor.monitoring;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/monitoring")
public class SystemMonitoringController {
    private final SystemMonitoringService monitoringService;
    private final SystemMetricRepository repository;

    public SystemMonitoringController(
            SystemMonitoringService monitoringService,
            SystemMetricRepository repository) {
        this.monitoringService = monitoringService;
        this.repository = repository;
    }

    @PostMapping("/collect")
    public SystemMetric collectNow() {
        return monitoringService.collectAndSave();
    }

    @GetMapping("/latest")
    public SystemMetric latest() {
        return repository.findAllByOrderByRecordedAtDesc(PageRequest.of(0, 1))
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No monitoring records found"));
    }

    @GetMapping("/history")
    public List<SystemMetric> history(@RequestParam(defaultValue = "20") int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return repository.findAllByOrderByRecordedAtDesc(PageRequest.of(0, safeLimit));
    }
}
