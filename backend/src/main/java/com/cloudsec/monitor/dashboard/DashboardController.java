package com.cloudsec.monitor.dashboard;

import com.cloudsec.monitor.dashboard.dto.AnalystWorkloadResponse;
import com.cloudsec.monitor.dashboard.dto.DashboardEventFeedResponse;
import com.cloudsec.monitor.dashboard.dto.DashboardInsightsResponse;
import com.cloudsec.monitor.dashboard.dto.DashboardSummaryResponse;
import com.cloudsec.monitor.dashboard.dto.DashboardTrendsResponse;
import com.cloudsec.monitor.incident.dto.IncidentResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("isAuthenticated()")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getSummary() {
        return ResponseEntity.ok(dashboardService.getSummary());
    }

    @GetMapping("/trends")
    public ResponseEntity<DashboardTrendsResponse> getTrends() {
        return ResponseEntity.ok(dashboardService.getTrends());
    }

    @GetMapping("/workload")
    public ResponseEntity<List<AnalystWorkloadResponse>> getWorkload() {
        return ResponseEntity.ok(dashboardService.getWorkload());
    }

    @GetMapping("/at-risk")
    public ResponseEntity<List<IncidentResponse>> getAtRisk() {
        return ResponseEntity.ok(dashboardService.getAtRisk());
    }

    @GetMapping("/feed")
    public ResponseEntity<List<DashboardEventFeedResponse>> getFeed(
            @RequestParam(defaultValue = "30") int limit
    ) {
        return ResponseEntity.ok(dashboardService.getFeed(limit));
    }

    @GetMapping("/insights")
    public ResponseEntity<DashboardInsightsResponse> getInsights() {
        return ResponseEntity.ok(dashboardService.getInsights());
    }
}
