package com.cloudsec.monitor.incident.dto;

import com.cloudsec.monitor.incident.IncidentPriority;
import com.cloudsec.monitor.incident.SlaPolicy;

public class SlaPolicyResponse {

    private IncidentPriority priority;
    private int resolveMinutes;
    private int firstEscalationPct;
    private int secondEscalationPct;

    public SlaPolicyResponse() {}

    public static SlaPolicyResponse from(SlaPolicy policy) {
        SlaPolicyResponse dto = new SlaPolicyResponse();
        dto.setPriority(policy.getPriority());
        dto.setResolveMinutes(policy.getResolveMinutes());
        dto.setFirstEscalationPct(policy.getFirstEscalationPct());
        dto.setSecondEscalationPct(policy.getSecondEscalationPct());
        return dto;
    }

    public IncidentPriority getPriority() {
        return priority;
    }

    public void setPriority(IncidentPriority priority) {
        this.priority = priority;
    }

    public int getResolveMinutes() {
        return resolveMinutes;
    }

    public void setResolveMinutes(int resolveMinutes) {
        this.resolveMinutes = resolveMinutes;
    }

    public int getFirstEscalationPct() {
        return firstEscalationPct;
    }

    public void setFirstEscalationPct(int firstEscalationPct) {
        this.firstEscalationPct = firstEscalationPct;
    }

    public int getSecondEscalationPct() {
        return secondEscalationPct;
    }

    public void setSecondEscalationPct(int secondEscalationPct) {
        this.secondEscalationPct = secondEscalationPct;
    }
}
