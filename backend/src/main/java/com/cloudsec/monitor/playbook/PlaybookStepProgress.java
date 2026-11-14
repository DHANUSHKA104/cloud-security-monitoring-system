
package com.cloudsec.monitor.playbook;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "playbook_step_progress")
public class PlaybookStepProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "execution_id", nullable = false)
    private PlaybookExecution execution;

    @Column(nullable = false)
    private String stepTitle;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlaybookStepStatus status = PlaybookStepStatus.PENDING;

    public PlaybookStepProgress() {
    }

    public PlaybookStepProgress(
            PlaybookExecution execution,
            String stepTitle,
            String description) {
        this.execution = execution;
        this.stepTitle = stepTitle;
        this.description = description;
        this.status = PlaybookStepStatus.PENDING;
    }

    public Long getId() {
        return id;
    }

    public PlaybookExecution getExecution() {
        return execution;
    }

    public String getStepTitle() {
        return stepTitle;
    }

    public String getDescription() {
        return description;
    }

    public PlaybookStepStatus getStatus() {
        return status;
    }

    public void setStatus(PlaybookStepStatus status) {
        this.status = status;
    }
}
