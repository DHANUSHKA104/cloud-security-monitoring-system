package com.cloudsec.monitor.playbook.dto;

import com.cloudsec.monitor.playbook.IncidentPlaybookExecution;

import java.time.Instant;
import java.util.UUID;

public class ExecutePlaybookStepResponse {

    private UUID id;
    private UUID incidentId;
    private UUID playbookId;
    private UUID stepId;
    private UUID executedById;
    private String executedByName;
    private String status;
    private String notes;
    private Instant executedAt;

    public ExecutePlaybookStepResponse() {
    }

    public static ExecutePlaybookStepResponse fromEntity(IncidentPlaybookExecution exec) {
        if (exec == null) return null;
        ExecutePlaybookStepResponse resp = new ExecutePlaybookStepResponse();
        resp.setId(exec.getId());
        resp.setIncidentId(exec.getIncidentId());
        resp.setPlaybookId(exec.getPlaybookId());
        resp.setStepId(exec.getStepId());
        if (exec.getExecutedBy() != null) {
            resp.setExecutedById(exec.getExecutedBy().getId());
            resp.setExecutedByName(exec.getExecutedBy().getFullName());
        }
        resp.setStatus(exec.getStatus());
        resp.setNotes(exec.getNotes());
        resp.setExecutedAt(exec.getExecutedAt());
        return resp;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getIncidentId() {
        return incidentId;
    }

    public void setIncidentId(UUID incidentId) {
        this.incidentId = incidentId;
    }

    public UUID getPlaybookId() {
        return playbookId;
    }

    public void setPlaybookId(UUID playbookId) {
        this.playbookId = playbookId;
    }

    public UUID getStepId() {
        return stepId;
    }

    public void setStepId(UUID stepId) {
        this.stepId = stepId;
    }

    public UUID getExecutedById() {
        return executedById;
    }

    public void setExecutedById(UUID executedById) {
        this.executedById = executedById;
    }

    public String getExecutedByName() {
        return executedByName;
    }

    public void setExecutedByName(String executedByName) {
        this.executedByName = executedByName;
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

    public Instant getExecutedAt() {
        return executedAt;
    }

    public void setExecutedAt(Instant executedAt) {
        this.executedAt = executedAt;
    }
}
