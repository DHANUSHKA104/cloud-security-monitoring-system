package com.cloudsec.monitor.playbook;

import com.cloudsec.monitor.user.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incident_playbook_executions", uniqueConstraints = {
        @UniqueConstraint(name = "uq_incident_step_exec", columnNames = {"incident_id", "step_id"})
})
public class IncidentPlaybookExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "incident_id", nullable = false)
    private UUID incidentId;

    @Column(name = "playbook_id", nullable = false)
    private UUID playbookId;

    @Column(name = "step_id", nullable = false)
    private UUID stepId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "executed_by", nullable = false)
    private User executedBy;

    @Column(nullable = false, length = 30)
    private String status = "COMPLETED";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "executed_at", nullable = false)
    private Instant executedAt;

    public IncidentPlaybookExecution() {
    }

    public IncidentPlaybookExecution(UUID incidentId, UUID playbookId, UUID stepId, User executedBy, String status, String notes) {
        this.incidentId = incidentId;
        this.playbookId = playbookId;
        this.stepId = stepId;
        this.executedBy = executedBy;
        this.status = status != null ? status : "COMPLETED";
        this.notes = notes;
        this.executedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (executedAt == null) {
            executedAt = Instant.now();
        }
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

    public User getExecutedBy() {
        return executedBy;
    }

    public void setExecutedBy(User executedBy) {
        this.executedBy = executedBy;
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
