package com.cloudsec.monitor.team.dto;

import com.cloudsec.monitor.team.Team;

import java.util.UUID;

public class TeamResponse {
    private UUID id;
    private String name;
    private String description;
    private UUID leadId;
    private String leadName;
    private int memberCount;

    public TeamResponse() {}

    public static TeamResponse from(Team team, UUID leadId, String leadName, int memberCount) {
        TeamResponse res = new TeamResponse();
        res.id = team.getId();
        res.name = team.getName();
        res.description = team.getDescription();
        res.leadId = leadId;
        res.leadName = leadName;
        res.memberCount = memberCount;
        return res;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    public UUID getLeadId() {
        return leadId;
    }

    public void setLeadId(UUID leadId) {
        this.leadId = leadId;
    }

    public String getLeadName() {
        return leadName;
    }

    public void setLeadName(String leadName) {
        this.leadName = leadName;
    }

    public int getMemberCount() {
        return memberCount;
    }

    public void setMemberCount(int memberCount) {
        this.memberCount = memberCount;
    }
}
