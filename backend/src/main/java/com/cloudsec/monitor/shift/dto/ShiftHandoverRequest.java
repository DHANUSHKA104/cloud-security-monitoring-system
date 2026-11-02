package com.cloudsec.monitor.shift.dto;

import java.util.UUID;

public class ShiftHandoverRequest {

    private String notes;
    private UUID nextAnalystId;

    public ShiftHandoverRequest() {}

    public ShiftHandoverRequest(String notes, UUID nextAnalystId) {
        this.notes = notes;
        this.nextAnalystId = nextAnalystId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public UUID getNextAnalystId() {
        return nextAnalystId;
    }

    public void setNextAnalystId(UUID nextAnalystId) {
        this.nextAnalystId = nextAnalystId;
    }
}
