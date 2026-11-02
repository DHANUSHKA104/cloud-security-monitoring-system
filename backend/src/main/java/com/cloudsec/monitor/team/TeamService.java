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
        return teamRepository.findAll().stream().map(this::buildTeamResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TeamResponse getTeamById(UUID id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Team not found"));
        return buildTeamResponse(team);
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
        return buildTeamResponse(saved);
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

        if (!user.isActive()) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Cannot assign inactive user to team");
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElse(new TeamMember(team, user, role));

        member.setTeamRole(role);
        teamMemberRepository.save(member);
    }

    @Transactional
    public void removeTeamMember(UUID teamId, UUID userId) {
        if (!teamRepository.existsById(teamId)) {
            throw new ApiException(ErrorCode.NOT_FOUND, "Team not found");
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Team member not found"));

        teamMemberRepository.delete(member);
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

    private TeamResponse buildTeamResponse(Team team) {
        List<TeamMember> members = teamMemberRepository.findByTeamId(team.getId());
        List<TeamMember> leads = members.stream()
                .filter(m -> m.getTeamRole() == TeamRole.LEAD)
                .collect(Collectors.toList());

        UUID leadId = leads.isEmpty() ? null : leads.get(0).getUser().getId();
        String leadName = leads.stream()
                .map(m -> m.getUser().getFullName())
                .collect(Collectors.joining(", "));
        if (leadName.isBlank()) {
            leadName = null;
        }

        return TeamResponse.from(team, leadId, leadName, members.size());
    }
}
