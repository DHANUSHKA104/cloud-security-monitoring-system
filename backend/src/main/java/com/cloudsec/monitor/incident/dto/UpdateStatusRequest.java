package com.cloudsec.monitor.incident.dto;

import com.cloudsec.monitor.incident.IncidentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UpdateStatusRequest {

    @NotNull(message = "Status is required")
    private IncidentStatus status;

    @Size(max = 1000, message = "Note cannot exceed 1000 characters")
    private String note;

    public UpdateStatusRequest() {}

    public UpdateStatusRequest(IncidentStatus status, String note) {
        this.status = status;
        this.note = note;
    }

    public IncidentStatus getStatus() {
        return status;
    }

    public void setStatus(IncidentStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
