package com.cloudsec.monitor.incident.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class AssignRequest {

    @NotNull(message = "Assignee ID is required")
    private UUID assigneeId;

    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    private String reason;

    public AssignRequest() {}

    public AssignRequest(UUID assigneeId, String reason) {
        this.assigneeId = assigneeId;
        this.reason = reason;
    }

    public UUID getAssigneeId() {
        return assigneeId;
    }

    public void setAssigneeId(UUID assigneeId) {
        this.assigneeId = assigneeId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
