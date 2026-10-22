package com.cloudsec.monitor.incident.dto;

import com.cloudsec.monitor.incident.IncidentEvent;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.UUID;

public class TimelineEventResponse {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private UUID id;
    private UUID incidentId;
    private String type;
    private IncidentResponse.UserSummary actor;
    private Object payload;
    private Instant createdAt;

    public TimelineEventResponse() {}

    public static TimelineEventResponse from(IncidentEvent event) {
        TimelineEventResponse dto = new TimelineEventResponse();
        dto.setId(event.getId());
        dto.setIncidentId(event.getIncident() != null ? event.getIncident().getId() : null);
        dto.setType(event.getType());

        if (event.getActor() != null) {
            dto.setActor(new IncidentResponse.UserSummary(event.getActor().getId(), event.getActor().getFullName()));
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

    public IncidentResponse.UserSummary getActor() {
        return actor;
    }

    public void setActor(IncidentResponse.UserSummary actor) {
        this.actor = actor;
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
