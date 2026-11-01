package com.cloudsec.monitor.team;

import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.team.dto.*;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;

    public TeamService(
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository,
            UserRepository userRepository,
            SkillRepository skillRepository
    ) {
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.userRepository = userRepository;
        this.skillRepository = skillRepository;
    }

    @Transactional(readOnly = true)
    public List<TeamResponse> getTeams() {
        return teamRepository.findAll().stream().map(team -> {
            List<TeamMember> members = teamMemberRepository.findByTeamId(team.getId());
            Optional<TeamMember> leadOpt = members.stream()
                    .filter(m -> m.getTeamRole() == TeamRole.LEAD)
                    .findFirst();

            UUID leadId = leadOpt.map(m -> m.getUser().getId()).orElse(null);
            String leadName = leadOpt.map(m -> m.getUser().getFullName()).orElse(null);

            return TeamResponse.from(team, leadId, leadName, members.size());
        }).collect(Collectors.toList());
    }

    @Transactional
    public TeamResponse createTeam(CreateTeamRequest request) {
        if (teamRepository.existsByName(request.getName())) {
            throw new ApiException(ErrorCode.CONFLICT, "A team with this name already exists");
        }

        Team team = new Team(request.getName(), request.getDescription());
        Team saved = teamRepository.save(team);
        return TeamResponse.from(saved, null, null, 0);
    }

    @Transactional
    public TeamResponse updateTeam(UUID id, UpdateTeamRequest request) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Team not found"));

        if (request.getName() != null && !request.getName().isBlank()) {
            if (!team.getName().equalsIgnoreCase(request.getName()) && teamRepository.existsByName(request.getName())) {
                throw new ApiException(ErrorCode.CONFLICT, "A team with this name already exists");
            }
            team.setName(request.getName());
        }

        if (request.getDescription() != null) {
            team.setDescription(request.getDescription());
        }

        Team saved = teamRepository.save(team);
        List<TeamMember> members = teamMemberRepository.findByTeamId(id);
        Optional<TeamMember> leadOpt = members.stream()
                .filter(m -> m.getTeamRole() == TeamRole.LEAD)
                .findFirst();

        return TeamResponse.from(
                saved,
                leadOpt.map(m -> m.getUser().getId()).orElse(null),
                leadOpt.map(m -> m.getUser().getFullName()).orElse(null),
                members.size()
        );
    }

    @Transactional(readOnly = true)
    public List<TeamMemberResponse> getTeamMembers(UUID teamId) {
        if (!teamRepository.existsById(teamId)) {
            throw new ApiException(ErrorCode.NOT_FOUND, "Team not found");
        }

        return teamMemberRepository.findByTeamId(teamId).stream()
                .map(TeamMemberResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void setTeamMember(UUID teamId, UUID userId, TeamRole role) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Team not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found"));

        // Prevent inactive users from being added to teams.
        if (!user.isActive()) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR,
                    "Cannot add an inactive user to a team. Reactivate the user first.");
        }

        // Enforce single-LEAD rule: demote any existing LEAD to MEMBER before promoting a new one.
        // Performed within the same transaction for consistency.
        if (role == TeamRole.LEAD) {
            List<TeamMember> currentLeads = teamMemberRepository.findTeamLeads(teamId);
            for (TeamMember existingLead : currentLeads) {
                if (!existingLead.getUser().getId().equals(userId)) {
                    existingLead.setTeamRole(TeamRole.MEMBER);
                    teamMemberRepository.save(existingLead);
                }
            }
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElse(new TeamMember(team, user, role));

        member.setTeamRole(role);
        teamMemberRepository.save(member);
    }

    @Transactional
    public void removeTeamMember(UUID teamId, UUID userId) {
        // Return 404 when the team does not exist.
        if (!teamRepository.existsById(teamId)) {
            throw new ApiException(ErrorCode.NOT_FOUND, "Team not found");
        }
        // Return 404 when the user does not exist.
        if (!userRepository.existsById(userId)) {
            throw new ApiException(ErrorCode.NOT_FOUND, "User not found");
        }
        // Return 404 when the membership does not exist.
        if (teamMemberRepository.findByTeamIdAndUserId(teamId, userId).isEmpty()) {
            throw new ApiException(ErrorCode.NOT_FOUND, "Membership not found");
        }
        teamMemberRepository.deleteByTeamIdAndUserId(teamId, userId);
    }

    public List<SkillResponse> getSkills() {
        return skillRepository.findAll().stream()
                .map(SkillResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public SkillResponse createSkill(SkillRequest request) {
        if (skillRepository.existsByName(request.getName())) {
            throw new ApiException(ErrorCode.CONFLICT, "A skill with this name already exists");
        }

        Skill skill = new Skill(request.getName());
        Skill saved = skillRepository.save(skill);
        return SkillResponse.from(saved);
    }
}
