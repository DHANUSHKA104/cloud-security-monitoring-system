package com.cloudsec.monitor.asset.dto;

import java.util.Map;

public class AssetStatsResponse {

    private long totalAssets;
    private long activeAssets;
    private long criticalAssets;
    private Map<String, Long> byCloudProvider;
    private Map<String, Long> byCriticality;
    private Map<String, Long> byType;

    public AssetStatsResponse() {
    }

    public AssetStatsResponse(
            long totalAssets,
            long activeAssets,
            long criticalAssets,
            Map<String, Long> byCloudProvider,
            Map<String, Long> byCriticality,
            Map<String, Long> byType
    ) {
        this.totalAssets = totalAssets;
        this.activeAssets = activeAssets;
        this.criticalAssets = criticalAssets;
        this.byCloudProvider = byCloudProvider;
        this.byCriticality = byCriticality;
        this.byType = byType;
    }

    public long getTotalAssets() {
        return totalAssets;
    }

    public void setTotalAssets(long totalAssets) {
        this.totalAssets = totalAssets;
    }

    public long getActiveAssets() {
        return activeAssets;
    }

    public void setActiveAssets(long activeAssets) {
        this.activeAssets = activeAssets;
    }

    public long getCriticalAssets() {
        return criticalAssets;
    }

    public void setCriticalAssets(long criticalAssets) {
        this.criticalAssets = criticalAssets;
    }

    public Map<String, Long> getByCloudProvider() {
        return byCloudProvider;
    }

    public void setByCloudProvider(Map<String, Long> byCloudProvider) {
        this.byCloudProvider = byCloudProvider;
    }

    public Map<String, Long> getByCriticality() {
        return byCriticality;
    }

    public void setByCriticality(Map<String, Long> byCriticality) {
        this.byCriticality = byCriticality;
    }

    public Map<String, Long> getByType() {
        return byType;
    }

    public void setByType(Map<String, Long> byType) {
        this.byType = byType;
    }
}
