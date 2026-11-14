
package com.cloudsec.monitor.dashboard.dto;

public class DashboardSummaryResponse {

    private long openIncidents;
    private long p1Open;
    private double threatScore;
    private String threatLevel;
    private double slaCompliancePct;
    private double mttrMinutes;
    private double mttaMinutes;
    private long atRiskCount;
    private long breachedCount;

    // Asset & Playbook integrated metrics
    private long totalAssets;
    private long criticalAssets;
    private long totalPlaybooks;
    private long executedPlaybookSteps;

    public DashboardSummaryResponse() {}

    public DashboardSummaryResponse(
            long openIncidents,
            long p1Open,
            double threatScore,
            String threatLevel,
            double slaCompliancePct,
            double mttrMinutes,
            double mttaMinutes,
            long atRiskCount,
            long breachedCount
    ) {
        this.openIncidents = openIncidents;
        this.p1Open = p1Open;
        this.threatScore = threatScore;
        this.threatLevel = threatLevel;
        this.slaCompliancePct = slaCompliancePct;
        this.mttrMinutes = mttrMinutes;
        this.mttaMinutes = mttaMinutes;
        this.atRiskCount = atRiskCount;
        this.breachedCount = breachedCount;
    }

    public long getOpenIncidents() {
        return openIncidents;
    }

    public void setOpenIncidents(long openIncidents) {
        this.openIncidents = openIncidents;
    }

    public long getP1Open() {
        return p1Open;
    }

    public void setP1Open(long p1Open) {
        this.p1Open = p1Open;
    }

    public double getThreatScore() {
        return threatScore;
    }

    public void setThreatScore(double threatScore) {
        this.threatScore = threatScore;
    }

    public String getThreatLevel() {
        return threatLevel;
    }

    public void setThreatLevel(String threatLevel) {
        this.threatLevel = threatLevel;
    }

    public double getSlaCompliancePct() {
        return slaCompliancePct;
    }

    public void setSlaCompliancePct(double slaCompliancePct) {
        this.slaCompliancePct = slaCompliancePct;
    }

    public double getMttrMinutes() {
        return mttrMinutes;
    }

    public void setMttrMinutes(double mttrMinutes) {
        this.mttrMinutes = mttrMinutes;
    }

    public double getMttaMinutes() {
        return mttaMinutes;
    }

    public void setMttaMinutes(double mttaMinutes) {
        this.mttaMinutes = mttaMinutes;
    }

    public long getAtRiskCount() {
        return atRiskCount;
    }

    public void setAtRiskCount(long atRiskCount) {
        this.atRiskCount = atRiskCount;
    }

    public long getBreachedCount() {
        return breachedCount;
    }

    public void setBreachedCount(long breachedCount) {
        this.breachedCount = breachedCount;
    }

    public long getTotalAssets() {
        return totalAssets;
    }

    public void setTotalAssets(long totalAssets) {
        this.totalAssets = totalAssets;
    }

    public long getCriticalAssets() {
        return criticalAssets;
    }

    public void setCriticalAssets(long criticalAssets) {
        this.criticalAssets = criticalAssets;
    }

    public long getTotalPlaybooks() {
        return totalPlaybooks;
    }

    public void setTotalPlaybooks(long totalPlaybooks) {
        this.totalPlaybooks = totalPlaybooks;
    }

    public long getExecutedPlaybookSteps() {
        return executedPlaybookSteps;
    }

    public void setExecutedPlaybookSteps(long executedPlaybookSteps) {
        this.executedPlaybookSteps = executedPlaybookSteps;
    }
}
