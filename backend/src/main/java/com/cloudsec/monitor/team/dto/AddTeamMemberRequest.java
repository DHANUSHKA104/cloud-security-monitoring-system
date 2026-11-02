package com.cloudsec.monitor.team.dto;

import com.cloudsec.monitor.team.TeamRole;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class AddTeamMemberRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotNull(message = "Team role (MEMBER or LEAD) is required")
    private TeamRole teamRole;

    public AddTeamMemberRequest() {}

    public AddTeamMemberRequest(UUID userId, TeamRole teamRole) {
        this.userId = userId;
        this.teamRole = teamRole;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public TeamRole getTeamRole() {
        return teamRole;
    }

    public void setTeamRole(TeamRole teamRole) {
        this.teamRole = teamRole;
    }
}
