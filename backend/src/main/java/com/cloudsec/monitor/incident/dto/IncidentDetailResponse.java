package com.cloudsec.monitor.incident.dto;

import com.cloudsec.monitor.incident.Incident;
import com.cloudsec.monitor.incident.IncidentEvent;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class IncidentDetailResponse {

    private IncidentResponse incident;
    private List<TimelineEventResponse> timeline = new ArrayList<>();

    public IncidentDetailResponse() {}

    public IncidentDetailResponse(Incident incident, List<IncidentEvent> events) {
        this.incident = IncidentResponse.from(incident);
        if (events != null) {
            this.timeline = events.stream().map(TimelineEventResponse::from).collect(Collectors.toList());
        }
    }

    public IncidentResponse getIncident() {
        return incident;
    }

    public void setIncident(IncidentResponse incident) {
        this.incident = incident;
    }

    public List<TimelineEventResponse> getTimeline() {
        return timeline;
    }

    public void setTimeline(List<TimelineEventResponse> timeline) {
        this.timeline = timeline;
    }
}
