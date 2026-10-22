package com.cloudsec.monitor.team.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class SkillRequest {

    @NotBlank(message = "Use lowercase letters, digits and hyphens")
    @Size(min = 2, max = 50, message = "Use lowercase letters, digits and hyphens")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Use lowercase letters, digits and hyphens")
    private String name;

    public SkillRequest() {}

    public SkillRequest(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
