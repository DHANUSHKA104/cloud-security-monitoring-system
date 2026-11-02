package com.cloudsec.monitor.team;

import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.team.dto.CreateTeamRequest;
import com.cloudsec.monitor.team.dto.TeamResponse;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private TeamMemberRepository teamMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SkillRepository skillRepository;

    @InjectMocks
    private TeamService teamService;

    private Team sampleTeam;
    private User sampleUser1;
    private User sampleUser2;

    @BeforeEach
    void setUp() {
        sampleTeam = new Team("SOC Alpha", "Tier 1 Triage");
        sampleTeam.setId(UUID.randomUUID());

        sampleUser1 = new User("lead1@cloudsec.local", "hash", "Lead One", "SOC", Role.ANALYST);
        sampleUser1.setId(UUID.randomUUID());

        sampleUser2 = new User("lead2@cloudsec.local", "hash", "Lead Two", "SOC", Role.ANALYST);
        sampleUser2.setId(UUID.randomUUID());
    }

    @Test
    void createTeam_WhenNameExists_ThrowsConflict409() {
        CreateTeamRequest request = new CreateTeamRequest("SOC Alpha", "Desc");
        when(teamRepository.existsByName("SOC Alpha")).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class, () -> teamService.createTeam(request));
        assertEquals(ErrorCode.CONFLICT, ex.getErrorCode());
        assertEquals("A team with this name already exists", ex.getMessage());
    }

    @Test
    void createTeam_WhenValid_SavesAndReturns() {
        CreateTeamRequest request = new CreateTeamRequest("SOC Beta", "Desc");
        when(teamRepository.existsByName("SOC Beta")).thenReturn(false);
        when(teamRepository.save(any(Team.class))).thenAnswer(i -> {
            Team t = i.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        TeamResponse res = teamService.createTeam(request);
        assertNotNull(res);
        assertEquals("SOC Beta", res.getName());
    }

    @Test
    void getTeamById_WhenNotFound_ThrowsNotFound404() {
        UUID id = UUID.randomUUID();
        when(teamRepository.findById(id)).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () -> teamService.getTeamById(id));
        assertEquals(ErrorCode.NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void setTeamMember_MultiLead_DoesNotDemoteExistingLeads() {
        when(teamRepository.findById(sampleTeam.getId())).thenReturn(Optional.of(sampleTeam));
        when(userRepository.findById(sampleUser2.getId())).thenReturn(Optional.of(sampleUser2));
        when(teamMemberRepository.findByTeamIdAndUserId(sampleTeam.getId(), sampleUser2.getId())).thenReturn(Optional.empty());

        teamService.setTeamMember(sampleTeam.getId(), sampleUser2.getId(), TeamRole.LEAD);

        verify(teamMemberRepository).save(argThat(member ->
                member.getTeamRole() == TeamRole.LEAD && member.getUser().equals(sampleUser2)
        ));
    }

    @Test
    void setTeamMember_WhenUserInactive_ThrowsValidationError() {
        sampleUser1.setActive(false);
        when(teamRepository.findById(sampleTeam.getId())).thenReturn(Optional.of(sampleTeam));
        when(userRepository.findById(sampleUser1.getId())).thenReturn(Optional.of(sampleUser1));

        ApiException ex = assertThrows(ApiException.class, () ->
                teamService.setTeamMember(sampleTeam.getId(), sampleUser1.getId(), TeamRole.MEMBER));
        assertEquals(ErrorCode.VALIDATION_ERROR, ex.getErrorCode());
        assertEquals("Cannot assign inactive user to team", ex.getMessage());
    }

    @Test
    void removeTeamMember_WhenMemberNotFound_ThrowsNotFound404() {
        when(teamRepository.existsById(sampleTeam.getId())).thenReturn(true);
        when(teamMemberRepository.findByTeamIdAndUserId(sampleTeam.getId(), sampleUser1.getId())).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () ->
                teamService.removeTeamMember(sampleTeam.getId(), sampleUser1.getId()));
        assertEquals(ErrorCode.NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void removeTeamMember_WhenValid_DeletesMember() {
        TeamMember member = new TeamMember(sampleTeam, sampleUser1, TeamRole.MEMBER);
        when(teamRepository.existsById(sampleTeam.getId())).thenReturn(true);
        when(teamMemberRepository.findByTeamIdAndUserId(sampleTeam.getId(), sampleUser1.getId())).thenReturn(Optional.of(member));

        teamService.removeTeamMember(sampleTeam.getId(), sampleUser1.getId());
        verify(teamMemberRepository).delete(member);
    }
}
