package com.cloudsec.monitor.incident.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Size;

public class ReopenRequest {

    @Size(max = 500, message = "Note must be under 500 characters")
    @JsonAlias({"reason"})
    private String note;

    public ReopenRequest() {}

    public ReopenRequest(String note) {
        this.note = note;
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
