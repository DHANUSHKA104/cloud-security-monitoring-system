package com.cloudsec.monitor.team.dto;

import jakarta.validation.constraints.Size;

public class UpdateTeamRequest {

    @Size(min = 2, max = 80, message = "Team name must be 2 to 80 characters and unique")
    private String name;

    @Size(max = 255, message = "Description is too long")
    private String description;

    public UpdateTeamRequest() {}

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
