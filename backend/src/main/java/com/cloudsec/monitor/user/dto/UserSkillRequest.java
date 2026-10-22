package com.cloudsec.monitor.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class UserSkillRequest {

    @NotNull(message = "Skill ID is required")
    private UUID skillId;

    @NotNull(message = "Level is required")
    @Min(value = 1, message = "Level must be 1, 2 or 3")
    @Max(value = 3, message = "Level must be 1, 2 or 3")
    private Integer level;

    public UserSkillRequest() {}

    public UserSkillRequest(UUID skillId, Integer level) {
        this.skillId = skillId;
        this.level = level;
    }

    public UUID getSkillId() {
        return skillId;
    }

    public void setSkillId(UUID skillId) {
        this.skillId = skillId;
    }

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }
}
