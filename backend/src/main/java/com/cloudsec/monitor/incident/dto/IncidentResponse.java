package com.cloudsec.monitor.incident.dto;

import com.cloudsec.monitor.incident.Incident;
import com.cloudsec.monitor.incident.IncidentPriority;
import com.cloudsec.monitor.incident.IncidentStatus;
import com.cloudsec.monitor.incident.SlaState;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

public class IncidentResponse {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private UUID id;
    private String code;
    private String title;
    private String description;
    private IncidentPriority priority;
    private IncidentStatus status;
    private String category;
    private UUID teamId;
    private String teamName;
    private UserSummary assignee;
    private Instant createdAt;
    private Instant acknowledgedAt;
    private Instant resolvedAt;
    private Instant slaDueAt;
    private SlaState slaState;
    private long timeRemainingSeconds;
    private int escalationLevel;
    private UserSummary escalatedTo;
    private Object assignmentExplanation;
    private String assetId;
    private Integer riskScore;

    public IncidentResponse() {}

    public static IncidentResponse from(Incident incident) {
        IncidentResponse dto = new IncidentResponse();
        dto.setId(incident.getId());
        dto.setCode(incident.getCode());
        dto.setTitle(incident.getTitle());
        dto.setDescription(incident.getDescription());
        dto.setPriority(incident.getPriority());
        dto.setStatus(incident.getStatus());
        dto.setCategory(incident.getCategory());

        if (incident.getTeam() != null) {
            dto.setTeamId(incident.getTeam().getId());
            dto.setTeamName(incident.getTeam().getName());
        }

        if (incident.getAssignee() != null) {
            dto.setAssignee(new UserSummary(incident.getAssignee().getId(), incident.getAssignee().getFullName()));
        }

        dto.setCreatedAt(incident.getCreatedAt());
        dto.setAcknowledgedAt(incident.getAcknowledgedAt());
        dto.setResolvedAt(incident.getResolvedAt());
        dto.setSlaDueAt(incident.getSlaDueAt());
        dto.setEscalationLevel(incident.getEscalationLevel());

        if (incident.getEscalatedTo() != null) {
            dto.setEscalatedTo(new UserSummary(incident.getEscalatedTo().getId(), incident.getEscalatedTo().getFullName()));
        }

        dto.setAssetId(incident.getAssetId());
        dto.setRiskScore(incident.getRiskScore());

        // SLA calculation
        Instant now = Instant.now();
        if (incident.getStatus() == IncidentStatus.RESOLVED || incident.getStatus() == IncidentStatus.CLOSED) {
            dto.setTimeRemainingSeconds(0);
            if (incident.getResolvedAt() != null && incident.getResolvedAt().isAfter(incident.getSlaDueAt())) {
                dto.setSlaState(SlaState.BREACHED);
            } else {
                dto.setSlaState(SlaState.ON_TRACK);
            }
        } else {
            long remaining = Duration.between(now, incident.getSlaDueAt()).getSeconds();
            dto.setTimeRemainingSeconds(remaining);
            if (remaining <= 0) {
                dto.setSlaState(SlaState.BREACHED);
            } else if (remaining <= 1800) { // within 30 minutes
                dto.setSlaState(SlaState.AT_RISK);
            } else {
                dto.setSlaState(SlaState.ON_TRACK);
            }
        }

        // Assignment explanation parsing
        if (incident.getAssignmentExplanation() != null && !incident.getAssignmentExplanation().isBlank()) {
            try {
                dto.setAssignmentExplanation(OBJECT_MAPPER.readTree(incident.getAssignmentExplanation()));
            } catch (Exception ignored) {
                dto.setAssignmentExplanation(incident.getAssignmentExplanation());
            }
        }

        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
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

    public IncidentStatus getStatus() {
        return status;
    }

    public void setStatus(IncidentStatus status) {
        this.status = status;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public UUID getTeamId() {
        return teamId;
    }

    public void setTeamId(UUID teamId) {
        this.teamId = teamId;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public UserSummary getAssignee() {
        return assignee;
    }

    public void setAssignee(UserSummary assignee) {
        this.assignee = assignee;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(Instant acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public Instant getSlaDueAt() {
        return slaDueAt;
    }

    public void setSlaDueAt(Instant slaDueAt) {
        this.slaDueAt = slaDueAt;
    }

    public SlaState getSlaState() {
        return slaState;
    }

    public void setSlaState(SlaState slaState) {
        this.slaState = slaState;
    }

    public long getTimeRemainingSeconds() {
        return timeRemainingSeconds;
    }

    public void setTimeRemainingSeconds(long timeRemainingSeconds) {
        this.timeRemainingSeconds = timeRemainingSeconds;
    }

    public int getEscalationLevel() {
        return escalationLevel;
    }

    public void setEscalationLevel(int escalationLevel) {
        this.escalationLevel = escalationLevel;
    }

    public UserSummary getEscalatedTo() {
        return escalatedTo;
    }

    public void setEscalatedTo(UserSummary escalatedTo) {
        this.escalatedTo = escalatedTo;
    }

    public Object getAssignmentExplanation() {
        return assignmentExplanation;
    }

    public void setAssignmentExplanation(Object assignmentExplanation) {
        this.assignmentExplanation = assignmentExplanation;
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

    public record UserSummary(UUID id, String fullName) {}
}
