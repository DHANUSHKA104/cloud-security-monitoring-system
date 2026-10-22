package com.cloudsec.monitor.team.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateTeamRequest {

    @NotBlank(message = "Team name must be 2 to 80 characters and unique")
    @Size(min = 2, max = 80, message = "Team name must be 2 to 80 characters and unique")
    private String name;

    @Size(max = 255, message = "Description is too long")
    private String description;

    public CreateTeamRequest() {}

    public CreateTeamRequest(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
