package com.cloudsec.monitor.shift.dto;

import java.time.Instant;
import java.util.UUID;

public class ShiftHandoverResponse {

    private UUID shiftId;
    private UUID analystId;
    private String analystName;
    private Instant handoverTime;
    private String notes;
    private int pendingIncidentCount;
    private int p1Count;
    private int p2Count;
    private int p3Count;
    private int p4Count;
    private int atRiskCount;
    private int resolvedLast8Hours;
    private String summary;

    public ShiftHandoverResponse() {}

    public ShiftHandoverResponse(
            UUID shiftId,
            UUID analystId,
            String analystName,
            Instant handoverTime,
            String notes,
            int pendingIncidentCount,
            int p1Count,
            int p2Count,
            int p3Count,
            int p4Count,
            int atRiskCount,
            int resolvedLast8Hours,
            String summary
    ) {
        this.shiftId = shiftId;
        this.analystId = analystId;
        this.analystName = analystName;
        this.handoverTime = handoverTime;
        this.notes = notes;
        this.pendingIncidentCount = pendingIncidentCount;
        this.p1Count = p1Count;
        this.p2Count = p2Count;
        this.p3Count = p3Count;
        this.p4Count = p4Count;
        this.atRiskCount = atRiskCount;
        this.resolvedLast8Hours = resolvedLast8Hours;
        this.summary = summary;
    }

    public UUID getShiftId() {
        return shiftId;
    }

    public void setShiftId(UUID shiftId) {
        this.shiftId = shiftId;
    }

    public UUID getAnalystId() {
        return analystId;
    }

    public void setAnalystId(UUID analystId) {
        this.analystId = analystId;
    }

    public String getAnalystName() {
        return analystName;
    }

    public void setAnalystName(String analystName) {
        this.analystName = analystName;
    }

    public Instant getHandoverTime() {
        return handoverTime;
    }

    public void setHandoverTime(Instant handoverTime) {
        this.handoverTime = handoverTime;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public int getPendingIncidentCount() {
        return pendingIncidentCount;
    }

    public void setPendingIncidentCount(int pendingIncidentCount) {
        this.pendingIncidentCount = pendingIncidentCount;
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

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }
}
