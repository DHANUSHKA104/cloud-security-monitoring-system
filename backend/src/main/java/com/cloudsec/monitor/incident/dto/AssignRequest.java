package com.cloudsec.monitor.incident.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class AssignRequest {

    @NotNull(message = "Assignee ID is required")
    private UUID assigneeId;

    @Size(max = 500, message = "Note cannot exceed 500 characters")
    @JsonAlias({"reason"})
    private String note;

    public AssignRequest() {}

    public AssignRequest(UUID assigneeId, String note) {
        this.assigneeId = assigneeId;
        this.note = note;
    }

    public UUID getAssigneeId() {
        return assigneeId;
    }

    public void setAssigneeId(UUID assigneeId) {
        this.assigneeId = assigneeId;
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
