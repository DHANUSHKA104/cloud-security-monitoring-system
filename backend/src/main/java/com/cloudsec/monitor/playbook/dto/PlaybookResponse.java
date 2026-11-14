package com.cloudsec.monitor.playbook.dto;

import com.cloudsec.monitor.playbook.Playbook;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public class PlaybookResponse {

    private UUID id;
    private String code;
    private String title;
    private String category;
    private String description;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;
    private List<PlaybookStepResponse> steps = new ArrayList<>();

    public PlaybookResponse() {
    }

    public static PlaybookResponse fromEntity(Playbook playbook) {
        if (playbook == null) return null;
        PlaybookResponse resp = new PlaybookResponse();
        resp.setId(playbook.getId());
        resp.setCode(playbook.getCode());
        resp.setTitle(playbook.getTitle());
        resp.setCategory(playbook.getCategory());
        resp.setDescription(playbook.getDescription());
        resp.setActive(playbook.isActive());
        resp.setCreatedAt(playbook.getCreatedAt());
        resp.setUpdatedAt(playbook.getUpdatedAt());
        if (playbook.getSteps() != null) {
            resp.setSteps(playbook.getSteps().stream()
                    .map(PlaybookStepResponse::fromEntity)
                    .collect(Collectors.toList()));
        }
        return resp;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<PlaybookStepResponse> getSteps() {
        return steps;
    }

    public void setSteps(List<PlaybookStepResponse> steps) {
        this.steps = steps;
    }
}
