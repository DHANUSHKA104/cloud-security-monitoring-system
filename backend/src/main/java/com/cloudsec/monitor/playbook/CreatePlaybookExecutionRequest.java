package com.cloudsec.monitor.playbook;

import java.util.UUID;

public class CreatePlaybookExecutionRequest {

    private String category;
    private UUID incidentId;

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public UUID getIncidentId() {
        return incidentId;
    }

    public void setIncidentId(UUID incidentId) {
        this.incidentId = incidentId;
    }
}