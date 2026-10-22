package com.cloudsec.monitor.dashboard.dto;

import com.cloudsec.monitor.incident.IncidentEvent;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.UUID;

public class DashboardEventFeedResponse {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private UUID id;
    private UUID incidentId;
    private String type;
    private UUID actorId;
    private String actorName;
    private Object payload;
    private Instant createdAt;

    public DashboardEventFeedResponse() {}

    public static DashboardEventFeedResponse from(IncidentEvent event) {
        DashboardEventFeedResponse dto = new DashboardEventFeedResponse();
        dto.setId(event.getId());
        dto.setIncidentId(event.getIncident() != null ? event.getIncident().getId() : null);
        dto.setType(event.getType());

        if (event.getActor() != null) {
            dto.setActorId(event.getActor().getId());
            dto.setActorName(event.getActor().getFullName());
        } else {
            dto.setActorName("System");
        }

        dto.setCreatedAt(event.getCreatedAt());

        if (event.getPayload() != null && !event.getPayload().isBlank()) {
            try {
                dto.setPayload(OBJECT_MAPPER.readTree(event.getPayload()));
            } catch (Exception ignored) {
                dto.setPayload(event.getPayload());
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

    public UUID getIncidentId() {
        return incidentId;
    }

    public void setIncidentId(UUID incidentId) {
        this.incidentId = incidentId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public UUID getActorId() {
        return actorId;
    }

    public void setActorId(UUID actorId) {
        this.actorId = actorId;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public Object getPayload() {
        return payload;
    }

    public void setPayload(Object payload) {
        this.payload = payload;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
