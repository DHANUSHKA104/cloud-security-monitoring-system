package com.cloudsec.monitor.playbook.dto;

import com.cloudsec.monitor.playbook.PlaybookStep;

import java.util.UUID;

public class PlaybookStepResponse {

    private UUID id;
    private int stepOrder;
    private String name;
    private String instructions;
    private String actionType;
    private String riskLevel;

    public PlaybookStepResponse() {
    }

    public static PlaybookStepResponse fromEntity(PlaybookStep step) {
        if (step == null) return null;
        PlaybookStepResponse resp = new PlaybookStepResponse();
        resp.setId(step.getId());
        resp.setStepOrder(step.getStepOrder());
        resp.setName(step.getName());
        resp.setInstructions(step.getInstructions());
        resp.setActionType(step.getActionType());
        resp.setRiskLevel(step.getRiskLevel());
        return resp;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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
}
