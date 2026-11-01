package com.cloudsec.monitor.team;

import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.team.dto.CreateTeamRequest;
import com.cloudsec.monitor.team.dto.TeamMemberResponse;
import com.cloudsec.monitor.team.dto.TeamResponse;
import com.cloudsec.monitor.team.dto.UpdateTeamRequest;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TeamService — Phase 2 implementation")
class TeamServiceTest {

    @Mock private TeamRepository teamRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private UserRepository userRepository;
    @Mock private SkillRepository skillRepository;

    private TeamService teamService;

    @BeforeEach
    void setUp() {
        teamService = new TeamService(teamRepository, teamMemberRepository, userRepository, skillRepository);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private Team team(UUID id, String name) {
        Team t = new Team(name, "Test description");
        t.setId(id);
        return t;
    }

    private User activeUser(UUID id, String email) {
        User u = new User(email, "hash", "User " + email, "SOC", Role.ANALYST);
        u.setId(id);
        u.setActive(true);
        return u;
    }

    private User inactiveUser(UUID id) {
        User u = new User("inactive@example.com", "hash", "Inactive User", "SOC", Role.ANALYST);
        u.setId(id);
        u.setActive(false);
        return u;
    }

    private TeamMember memberOf(Team t, User u, TeamRole role) {
        return new TeamMember(t, u, role);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // createTeam
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("createTeam")
    class CreateTeamTests {

        @Test
        @DisplayName("creates team with unique name")
        void createsTeamSuccess() {
            UUID id = UUID.randomUUID();
            when(teamRepository.existsByName("Alpha")).thenReturn(false);
            Team saved = team(id, "Alpha");
            when(teamRepository.save(any(Team.class))).thenReturn(saved);

            CreateTeamRequest req = new CreateTeamRequest("Alpha", "Alpha team");
            TeamResponse res = teamService.createTeam(req);

            assertThat(res.getName()).isEqualTo("Alpha");
            verify(teamRepository).save(any(Team.class));
        }

        @Test
        @DisplayName("throws CONFLICT for duplicate team name")
        void duplicateNameThrowsConflict() {
            when(teamRepository.existsByName("Alpha")).thenReturn(true);

            assertThatThrownBy(() -> teamService.createTeam(new CreateTeamRequest("Alpha", null)))
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).getErrorCode())
                    .isEqualTo(ErrorCode.CONFLICT);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // updateTeam
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateTeam")
    class UpdateTeamTests {

        @Test
        @DisplayName("updates name and description")
        void updatesTeamSuccess() {
            UUID id = UUID.randomUUID();
            Team existing = team(id, "OldName");
            when(teamRepository.findById(id)).thenReturn(Optional.of(existing));
            when(teamRepository.existsByName("NewName")).thenReturn(false);
            when(teamRepository.save(existing)).thenReturn(existing);
            when(teamMemberRepository.findByTeamId(id)).thenReturn(new ArrayList<>());

            UpdateTeamRequest req = new UpdateTeamRequest();
            req.setName("NewName");
            req.setDescription("Updated description");

            TeamResponse res = teamService.updateTeam(id, req);
            assertThat(res.getName()).isEqualTo("NewName");
        }

        @Test
        @DisplayName("throws NOT_FOUND when team does not exist")
        void teamNotFoundThrows() {
            UUID id = UUID.randomUUID();
            when(teamRepository.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> teamService.updateTeam(id, new UpdateTeamRequest()))
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).getErrorCode())
                    .isEqualTo(ErrorCode.NOT_FOUND);
        }

        @Test
        @DisplayName("throws CONFLICT when new name is taken by another team")
        void duplicateNameOnUpdateThrowsConflict() {
            UUID id = UUID.randomUUID();
            Team existing = team(id, "Alpha");
            when(teamRepository.findById(id)).thenReturn(Optional.of(existing));
            when(teamRepository.existsByName("Beta")).thenReturn(true);

            UpdateTeamRequest req = new UpdateTeamRequest();
            req.setName("Beta");

            assertThatThrownBy(() -> teamService.updateTeam(id, req))
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).getErrorCode())
                    .isEqualTo(ErrorCode.CONFLICT);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // setTeamMember
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("setTeamMember")
    class SetTeamMemberTests {

        @Test
        @DisplayName("adds a new MEMBER")
        void addsMemberSuccessfully() {
            UUID teamId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            Team t = team(teamId, "Alpha");
            User u = activeUser(userId, "user@example.com");

            when(teamRepository.findById(teamId)).thenReturn(Optional.of(t));
            when(userRepository.findById(userId)).thenReturn(Optional.of(u));
            when(teamMemberRepository.findByTeamIdAndUserId(teamId, userId)).thenReturn(Optional.empty());

            assertThatNoException().isThrownBy(() -> teamService.setTeamMember(teamId, userId, TeamRole.MEMBER));

            verify(teamMemberRepository).save(any(TeamMember.class));
        }

        @Test
        @DisplayName("promotes a new LEAD and demotes the existing LEAD to MEMBER")
        void promotingLeadDemotesPreviousLead() {
            UUID teamId = UUID.randomUUID();
            UUID oldLeadId = UUID.randomUUID();
            UUID newLeadId = UUID.randomUUID();
            Team t = team(teamId, "Alpha");
            User oldLeadUser = activeUser(oldLeadId, "oldlead@example.com");
            User newLeadUser = activeUser(newLeadId, "newlead@example.com");

            TeamMember existingLead = memberOf(t, oldLeadUser, TeamRole.LEAD);

            when(teamRepository.findById(teamId)).thenReturn(Optional.of(t));
            when(userRepository.findById(newLeadId)).thenReturn(Optional.of(newLeadUser));
            when(teamMemberRepository.findTeamLeads(teamId)).thenReturn(List.of(existingLead));
            when(teamMemberRepository.findByTeamIdAndUserId(teamId, newLeadId)).thenReturn(Optional.empty());

            assertThatNoException().isThrownBy(() -> teamService.setTeamMember(teamId, newLeadId, TeamRole.LEAD));

            // Old lead must be saved as MEMBER
            assertThat(existingLead.getTeamRole()).isEqualTo(TeamRole.MEMBER);
            verify(teamMemberRepository).save(existingLead);
            // New lead must also be saved
            verify(teamMemberRepository, atLeastOnce()).save(any(TeamMember.class));
        }

        @Test
        @DisplayName("does not demote self when assigning LEAD to already-LEAD user")
        void reassigningLeadToSelfNoDemotion() {
            UUID teamId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            Team t = team(teamId, "Alpha");
            User u = activeUser(userId, "lead@example.com");
            TeamMember selfLead = memberOf(t, u, TeamRole.LEAD);

            when(teamRepository.findById(teamId)).thenReturn(Optional.of(t));
            when(userRepository.findById(userId)).thenReturn(Optional.of(u));
            when(teamMemberRepository.findTeamLeads(teamId)).thenReturn(List.of(selfLead));
            when(teamMemberRepository.findByTeamIdAndUserId(teamId, userId)).thenReturn(Optional.of(selfLead));

            assertThatNoException().isThrownBy(() -> teamService.setTeamMember(teamId, userId, TeamRole.LEAD));

            // Must still be LEAD — no demotion of self
            assertThat(selfLead.getTeamRole()).isEqualTo(TeamRole.LEAD);
        }

        @Test
        @DisplayName("throws VALIDATION_ERROR when adding an inactive user")
        void inactiveUserCannotJoinTeam() {
            UUID teamId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            Team t = team(teamId, "Alpha");
            User inactive = inactiveUser(userId);

            when(teamRepository.findById(teamId)).thenReturn(Optional.of(t));
            when(userRepository.findById(userId)).thenReturn(Optional.of(inactive));

            assertThatThrownBy(() -> teamService.setTeamMember(teamId, userId, TeamRole.MEMBER))
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).getErrorCode())
                    .isEqualTo(ErrorCode.VALIDATION_ERROR);
        }

        @Test
        @DisplayName("throws NOT_FOUND when team does not exist")
        void teamNotFoundThrows() {
            UUID teamId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            when(teamRepository.findById(teamId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> teamService.setTeamMember(teamId, userId, TeamRole.MEMBER))
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).getErrorCode())
                    .isEqualTo(ErrorCode.NOT_FOUND);
        }

        @Test
        @DisplayName("throws NOT_FOUND when user does not exist")
        void userNotFoundThrows() {
            UUID teamId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            Team t = team(teamId, "Alpha");
            when(teamRepository.findById(teamId)).thenReturn(Optional.of(t));
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> teamService.setTeamMember(teamId, userId, TeamRole.MEMBER))
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).getErrorCode())
                    .isEqualTo(ErrorCode.NOT_FOUND);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // removeTeamMember
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("removeTeamMember")
    class RemoveTeamMemberTests {

        @Test
        @DisplayName("removes member successfully when membership exists")
        void removesSuccessfully() {
            UUID teamId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            Team t = team(teamId, "Alpha");
            User u = activeUser(userId, "user@example.com");
            TeamMember tm = memberOf(t, u, TeamRole.MEMBER);

            when(teamRepository.existsById(teamId)).thenReturn(true);
            when(userRepository.existsById(userId)).thenReturn(true);
            when(teamMemberRepository.findByTeamIdAndUserId(teamId, userId)).thenReturn(Optional.of(tm));

            assertThatNoException().isThrownBy(() -> teamService.removeTeamMember(teamId, userId));

            verify(teamMemberRepository).deleteByTeamIdAndUserId(teamId, userId);
        }

        @Test
        @DisplayName("throws NOT_FOUND when team does not exist")
        void teamNotFoundThrows() {
            UUID teamId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            when(teamRepository.existsById(teamId)).thenReturn(false);

            assertThatThrownBy(() -> teamService.removeTeamMember(teamId, userId))
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).getErrorCode())
                    .isEqualTo(ErrorCode.NOT_FOUND);
        }

        @Test
        @DisplayName("throws NOT_FOUND when membership does not exist")
        void membershipNotFoundThrows() {
            UUID teamId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            when(teamRepository.existsById(teamId)).thenReturn(true);
            when(userRepository.existsById(userId)).thenReturn(true);
            when(teamMemberRepository.findByTeamIdAndUserId(teamId, userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> teamService.removeTeamMember(teamId, userId))
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).getErrorCode())
                    .isEqualTo(ErrorCode.NOT_FOUND);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // getTeamMembers
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getTeamMembers")
    class GetTeamMembersTests {

        @Test
        @DisplayName("returns members for existing team")
        void returnsMembersSuccessfully() {
            UUID teamId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            Team t = team(teamId, "Alpha");
            User u = activeUser(userId, "user@example.com");
            TeamMember tm = memberOf(t, u, TeamRole.MEMBER);

            when(teamRepository.existsById(teamId)).thenReturn(true);
            when(teamMemberRepository.findByTeamId(teamId)).thenReturn(List.of(tm));

            List<TeamMemberResponse> result = teamService.getTeamMembers(teamId);
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getUserId()).isEqualTo(userId);
        }

        @Test
        @DisplayName("throws NOT_FOUND when team does not exist")
        void teamNotFoundThrows() {
            UUID teamId = UUID.randomUUID();
            when(teamRepository.existsById(teamId)).thenReturn(false);

            assertThatThrownBy(() -> teamService.getTeamMembers(teamId))
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).getErrorCode())
                    .isEqualTo(ErrorCode.NOT_FOUND);
        }
    }
}

