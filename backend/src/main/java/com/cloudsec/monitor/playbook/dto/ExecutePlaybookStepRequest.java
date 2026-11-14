package com.cloudsec.monitor.playbook.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ExecutePlaybookStepRequest {

    @NotBlank(message = "Execution status is required")
    private String status = "COMPLETED";

    @Size(max = 2000, message = "Notes cannot exceed 2000 characters")
    private String notes;

    public ExecutePlaybookStepRequest() {
    }

    public ExecutePlaybookStepRequest(String status, String notes) {
        this.status = status;
        this.notes = notes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
