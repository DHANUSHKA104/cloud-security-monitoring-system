package com.cloudsec.monitor.incident.dto;

import jakarta.validation.constraints.Size;

import java.util.UUID;

public class EscalateRequest {

    private UUID toUserId;

    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    private String reason;

    public EscalateRequest() {}

    public EscalateRequest(UUID toUserId, String reason) {
        this.toUserId = toUserId;
        this.reason = reason;
    }

    public UUID getToUserId() {
        return toUserId;
    }

    public void setToUserId(UUID toUserId) {
        this.toUserId = toUserId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
