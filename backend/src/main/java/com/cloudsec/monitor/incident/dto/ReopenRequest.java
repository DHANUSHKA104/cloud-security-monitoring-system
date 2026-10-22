package com.cloudsec.monitor.incident.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ReopenRequest {

    @NotBlank(message = "Reason is required to reopen an incident")
    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    private String reason;

    public ReopenRequest() {}

    public ReopenRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
