package com.cloudsec.monitor.shift.dto;

import java.util.ArrayList;
import java.util.List;

public class HandoverResponse {
    private int openCount;
    private int p1Count;
    private int p2Count;
    private int p3Count;
    private int p4Count;
    private int atRiskCount;
    private int resolvedLast8Hours;
    private int noCoverageCount;
    private List<UrgentIncidentSummary> urgentIncidents = new ArrayList<>();
    private String templatedText;

    public HandoverResponse() {}

    public int getOpenCount() {
        return openCount;
    }

    public void setOpenCount(int openCount) {
        this.openCount = openCount;
    }

    public int getP1Count() {
        return p1Count;
    }

    public void setP1Count(int p1Count) {
        this.p1Count = p1Count;
    }

    public int getP2Count() {
        return p2Count;
    }

    public void setP2Count(int p2Count) {
        this.p2Count = p2Count;
    }

    public int getP3Count() {
        return p3Count;
    }

    public void setP3Count(int p3Count) {
        this.p3Count = p3Count;
    }

    public int getP4Count() {
        return p4Count;
    }

    public void setP4Count(int p4Count) {
        this.p4Count = p4Count;
    }

    public int getAtRiskCount() {
        return atRiskCount;
    }

    public void setAtRiskCount(int atRiskCount) {
        this.atRiskCount = atRiskCount;
    }

    public int getResolvedLast8Hours() {
        return resolvedLast8Hours;
    }

    public void setResolvedLast8Hours(int resolvedLast8Hours) {
        this.resolvedLast8Hours = resolvedLast8Hours;
    }

    public int getNoCoverageCount() {
        return noCoverageCount;
    }

    public void setNoCoverageCount(int noCoverageCount) {
        this.noCoverageCount = noCoverageCount;
    }

    public List<UrgentIncidentSummary> getUrgentIncidents() {
        return urgentIncidents;
    }

    public void setUrgentIncidents(List<UrgentIncidentSummary> urgentIncidents) {
        this.urgentIncidents = urgentIncidents != null ? urgentIncidents : new ArrayList<>();
    }

    public String getTemplatedText() {
        return templatedText;
    }

    public void setTemplatedText(String templatedText) {
        this.templatedText = templatedText;
    }

    public record UrgentIncidentSummary(String code, String title, String assigneeName, long minutesToDue) {}
}
