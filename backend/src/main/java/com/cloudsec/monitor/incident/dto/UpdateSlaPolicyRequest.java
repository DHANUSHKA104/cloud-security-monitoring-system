package com.cloudsec.monitor.incident.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class UpdateSlaPolicyRequest {

    @Min(value = 1, message = "Resolve minutes must be at least 1")
    @Max(value = 10080, message = "Resolve minutes cannot exceed 10080 (7 days)")
    private int resolveMinutes;

    @Min(value = 1, message = "First escalation percentage must be at least 1")
    @Max(value = 99, message = "First escalation percentage cannot exceed 99")
    private int firstEscalationPct;

    @Min(value = 1, message = "Second escalation percentage must be at least 1")
    @Max(value = 99, message = "Second escalation percentage cannot exceed 99")
    private int secondEscalationPct;

    public UpdateSlaPolicyRequest() {}

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
