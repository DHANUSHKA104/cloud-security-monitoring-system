package com.cloudsec.monitor.team.dto;

import com.cloudsec.monitor.team.TeamRole;
import jakarta.validation.constraints.NotNull;

public class TeamMemberRequest {

    @NotNull(message = "Team role (MEMBER or LEAD) is required")
    private TeamRole teamRole;

    public TeamMemberRequest() {}

    public TeamMemberRequest(TeamRole teamRole) {
        this.teamRole = teamRole;
    }

    public TeamRole getTeamRole() {
        return teamRole;
    }

    public void setTeamRole(TeamRole teamRole) {
        this.teamRole = teamRole;
    }
}
