package com.cloudsec.monitor.user.dto;

import com.cloudsec.monitor.auth.dto.UserResponse;
import com.cloudsec.monitor.user.User;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class UserDetailResponse extends UserResponse {

    private List<UserSkillDto> skills = new ArrayList<>();
    private List<UserTeamDto> teams = new ArrayList<>();

    public UserDetailResponse() {}

    public static UserDetailResponse from(User user, List<UserSkillDto> skills, List<UserTeamDto> teams) {
        UserDetailResponse res = new UserDetailResponse();
        res.setId(user.getId());
        res.setEmail(user.getEmail());
        res.setFullName(user.getFullName());
        res.setDepartment(user.getDepartment());
        res.setRole(user.getRole());
        res.setActive(user.isActive());
        res.setMfaEnabled(user.isMfaEnabled());
        res.setCreatedAt(user.getCreatedAt());
        res.setUpdatedAt(user.getUpdatedAt());
        res.skills = skills != null ? skills : new ArrayList<>();
        res.teams = teams != null ? teams : new ArrayList<>();
        return res;
    }

    public List<UserSkillDto> getSkills() {
        return skills;
    }

    public void setSkills(List<UserSkillDto> skills) {
        this.skills = skills;
    }

    public List<UserTeamDto> getTeams() {
        return teams;
    }

    public void setTeams(List<UserTeamDto> teams) {
        this.teams = teams;
    }

    public record UserSkillDto(UUID skillId, String skillName, int level) {}
    public record UserTeamDto(UUID teamId, String teamName, String teamRole) {}
}
