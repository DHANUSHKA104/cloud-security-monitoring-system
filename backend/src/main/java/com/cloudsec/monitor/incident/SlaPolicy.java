package com.cloudsec.monitor.incident;

import jakarta.persistence.*;

@Entity
@Table(name = "sla_policies")
public class SlaPolicy {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private IncidentPriority priority;

    @Column(name = "resolve_minutes", nullable = false)
    private int resolveMinutes;

    @Column(name = "first_escalation_pct", nullable = false)
    private int firstEscalationPct;

    @Column(name = "second_escalation_pct", nullable = false)
    private int secondEscalationPct;

    public SlaPolicy() {}

    public SlaPolicy(IncidentPriority priority, int resolveMinutes, int firstEscalationPct, int secondEscalationPct) {
        this.priority = priority;
        this.resolveMinutes = resolveMinutes;
        this.firstEscalationPct = firstEscalationPct;
        this.secondEscalationPct = secondEscalationPct;
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
