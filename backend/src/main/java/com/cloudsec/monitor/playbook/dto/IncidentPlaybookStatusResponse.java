package com.cloudsec.monitor.playbook.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class IncidentPlaybookStatusResponse {

    private UUID incidentId;
    private UUID playbookId;
    private String playbookCode;
    private String playbookTitle;
    private String category;
    private int totalSteps;
    private int completedSteps;
    private List<StepExecutionDetail> steps = new ArrayList<>();

    public IncidentPlaybookStatusResponse() {
    }

    public static class StepExecutionDetail {
        private UUID stepId;
        private int stepOrder;
        private String name;
        private String instructions;
        private String actionType;
        private String riskLevel;
        private boolean executed;
        private String status;
        private String executedByName;
        private String notes;
        private Instant executedAt;

        public StepExecutionDetail() {
        }

        public UUID getStepId() {
            return stepId;
        }

        public void setStepId(UUID stepId) {
            this.stepId = stepId;
        }

        public int getStepOrder() {
            return stepOrder;
        }

        public void setStepOrder(int stepOrder) {
            this.stepOrder = stepOrder;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getInstructions() {
            return instructions;
        }

        public void setInstructions(String instructions) {
            this.instructions = instructions;
        }

        public String getActionType() {
            return actionType;
        }

        public void setActionType(String actionType) {
            this.actionType = actionType;
        }

        public String getRiskLevel() {
            return riskLevel;
        }

        public void setRiskLevel(String riskLevel) {
            this.riskLevel = riskLevel;
        }

        public boolean isExecuted() {
            return executed;
        }

        public void setExecuted(boolean executed) {
            this.executed = executed;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getExecutedByName() {
            return executedByName;
        }

        public void setExecutedByName(String executedByName) {
            this.executedByName = executedByName;
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

    public String getPlaybookCode() {
        return playbookCode;
    }

    public void setPlaybookCode(String playbookCode) {
        this.playbookCode = playbookCode;
    }

    public String getPlaybookTitle() {
        return playbookTitle;
    }

    public void setPlaybookTitle(String playbookTitle) {
        this.playbookTitle = playbookTitle;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public int getTotalSteps() {
        return totalSteps;
    }

    public void setTotalSteps(int totalSteps) {
        this.totalSteps = totalSteps;
    }

    public int getCompletedSteps() {
        return completedSteps;
    }

    public void setCompletedSteps(int completedSteps) {
        this.completedSteps = completedSteps;
    }

    public List<StepExecutionDetail> getSteps() {
        return steps;
    }

    public void setSteps(List<StepExecutionDetail> steps) {
        this.steps = steps;
    }
}
