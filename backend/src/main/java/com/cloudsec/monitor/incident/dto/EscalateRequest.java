package com.cloudsec.monitor.incident.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class EscalateRequest {

    private UUID toUserId;

    @Size(max = 500, message = "Note cannot exceed 500 characters")
    @JsonAlias({"reason"})
    private String note;

    public EscalateRequest() {}

    public EscalateRequest(UUID toUserId, String note) {
        this.toUserId = toUserId;
        this.note = note;
    }

    public UUID getToUserId() {
        return toUserId;
    }

    public void setToUserId(UUID toUserId) {
        this.toUserId = toUserId;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getReason() {
        return note;
    }

    public void setReason(String reason) {
        this.note = reason;
    }
}
