package com.cloudsec.monitor.dashboard.dto;

public class DashboardSummaryResponse {

    private long openIncidents;
    private long p1Open;
    private double threatScore;
    private String threatLevel;
    private double slaCompliancePct;
    private double mttrMinutes;
    private long atRiskCount;
    private long breachedCount;

    public DashboardSummaryResponse() {}

    public DashboardSummaryResponse(
            long openIncidents,
            long p1Open,
            double threatScore,
            String threatLevel,
            double slaCompliancePct,
            double mttrMinutes,
            long atRiskCount,
            long breachedCount
    ) {
        this.openIncidents = openIncidents;
        this.p1Open = p1Open;
        this.threatScore = threatScore;
        this.threatLevel = threatLevel;
        this.slaCompliancePct = slaCompliancePct;
        this.mttrMinutes = mttrMinutes;
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
}
