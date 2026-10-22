package com.cloudsec.monitor.simulation.dto;

import com.cloudsec.monitor.incident.IncidentPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class SimIncidentRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Priority is required")
    private IncidentPriority priority;

    @NotBlank(message = "Category is required")
    private String category;

    private String assetId;

    private Integer riskScore;

    private UUID teamId;

    public SimIncidentRequest() {}

    public SimIncidentRequest(String title, String description, IncidentPriority priority, String category, String assetId, Integer riskScore, UUID teamId) {
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.category = category;
        this.assetId = assetId;
        this.riskScore = riskScore;
        this.teamId = teamId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public IncidentPriority getPriority() {
        return priority;
    }

    public void setPriority(IncidentPriority priority) {
        this.priority = priority;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getAssetId() {
        return assetId;
    }

    public void setAssetId(String assetId) {
        this.assetId = assetId;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }

    public UUID getTeamId() {
        return teamId;
    }

    public void setTeamId(UUID teamId) {
        this.teamId = teamId;
    }
}
