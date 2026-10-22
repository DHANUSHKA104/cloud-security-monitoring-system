package com.cloudsec.monitor.team.dto;

import com.cloudsec.monitor.team.TeamMember;
import com.cloudsec.monitor.team.TeamRole;

import java.util.UUID;

public class TeamMemberResponse {
    private UUID userId;
    private String fullName;
    private String email;
    private TeamRole teamRole;

    public TeamMemberResponse() {}

    public static TeamMemberResponse from(TeamMember tm) {
        TeamMemberResponse res = new TeamMemberResponse();
        res.userId = tm.getUser().getId();
        res.fullName = tm.getUser().getFullName();
        res.email = tm.getUser().getEmail();
        res.teamRole = tm.getTeamRole();
        return res;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public TeamRole getTeamRole() {
        return teamRole;
    }

    public void setTeamRole(TeamRole teamRole) {
        this.teamRole = teamRole;
    }
}
