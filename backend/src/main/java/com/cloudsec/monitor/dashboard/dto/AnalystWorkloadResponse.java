package com.cloudsec.monitor.dashboard.dto;

import java.util.UUID;

public class AnalystWorkloadResponse {

    private UUID userId;
    private String fullName;
    private long openCount;
    private double weightedLoad;
    private DashboardTrendsResponse.PriorityBreakdown byPriority;

    public AnalystWorkloadResponse() {}

    public AnalystWorkloadResponse(
            UUID userId,
            String fullName,
            long openCount,
            double weightedLoad,
            DashboardTrendsResponse.PriorityBreakdown byPriority
    ) {
        this.userId = userId;
        this.fullName = fullName;
        this.openCount = openCount;
        this.weightedLoad = weightedLoad;
        this.byPriority = byPriority;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public long getOpenCount() {
        return openCount;
    }

    public void setOpenCount(long openCount) {
        this.openCount = openCount;
    }

    public double getWeightedLoad() {
        return weightedLoad;
    }

    public void setWeightedLoad(double weightedLoad) {
        this.weightedLoad = weightedLoad;
    }

    public DashboardTrendsResponse.PriorityBreakdown getByPriority() {
        return byPriority;
    }

    public void setByPriority(DashboardTrendsResponse.PriorityBreakdown byPriority) {
        this.byPriority = byPriority;
    }
}
