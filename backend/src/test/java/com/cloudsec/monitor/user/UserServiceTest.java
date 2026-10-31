package com.cloudsec.monitor.user;

import com.cloudsec.monitor.auth.RefreshTokenRepository;
import com.cloudsec.monitor.auth.RefreshTokenService;
import com.cloudsec.monitor.auth.dto.UserResponse;
import com.cloudsec.monitor.common.dto.PageResponse;
import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.team.*;
import com.cloudsec.monitor.user.dto.CreateUserRequest;
import com.cloudsec.monitor.user.dto.UpdateUserRequest;
import com.cloudsec.monitor.user.dto.UserSkillRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService — Phase 1 fixes")
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private SkillRepository skillRepository;
    @Mock private UserSkillRepository userSkillRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private RefreshTokenRepository refreshTokenRepository;

    private RefreshTokenService refreshTokenService;
    private UserService userService;

    @BeforeEach
    void setUp() {
        refreshTokenService = new RefreshTokenService(refreshTokenRepository, 7, "dev");
        userService = new UserService(
                userRepository,
                skillRepository,
                userSkillRepository,
                teamMemberRepository,
                passwordEncoder,
                refreshTokenService
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private User activeAdmin(UUID id) {
        User u = new User("admin@example.com", "hash", "Admin User", "SOC", Role.ADMIN);
        u.setId(id);
        u.setActive(true);
        return u;
    }

    private User activeAnalyst(UUID id) {
        User u = new User("analyst@example.com", "hash", "Analyst User", "SOC", Role.ANALYST);
        u.setId(id);
        u.setActive(true);
        return u;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // getUsers — pagination/search smoke test
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getUsers")
    class GetUsersTests {

        @Test
        @DisplayName("returns wrapped page when repository returns data")
        void returnsPageResponse() {
            UUID uid = UUID.randomUUID();
            User u = activeAnalyst(uid);
            Page<User> mockPage = new PageImpl<>(List.of(u), PageRequest.of(0, 20), 1);

            when(userRepository.findAll(any(Specification.class), any(PageRequest.class)))
                    .thenReturn(mockPage);

            PageResponse<UserResponse> result =
                    userService.getUsers(null, null, null, PageRequest.of(0, 20));

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getContent().get(0).getEmail()).isEqualTo("analyst@example.com");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // createUser
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("createUser")
    class CreateUserTests {

        @Test
        @DisplayName("succeeds with valid distinct password")
        void createUserSuccess() {
            CreateUserRequest req = new CreateUserRequest();
            req.setEmail("new@example.com");
            req.setPassword("strongpass123");
            req.setFullName("New User");
            req.setDepartment("SOC");
            req.setRole(Role.ANALYST);

            when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
            when(passwordEncoder.encode("strongpass123")).thenReturn("HASH");

            User saved = new User("new@example.com", "HASH", "New User", "SOC", Role.ANALYST);
            saved.setId(UUID.randomUUID());
            when(userRepository.save(any(User.class))).thenReturn(saved);

            UserResponse response = userService.createUser(req);

            assertThat(response.getEmail()).isEqualTo("new@example.com");
            verify(passwordEncoder).encode("strongpass123");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("throws CONFLICT when email already exists")
        void duplicateEmailThrowsConflict() {
            CreateUserRequest req = new CreateUserRequest();
            req.setEmail("dup@example.com");
            req.setPassword("strongpass123");
            req.setFullName("Dup User");
            req.setRole(Role.ANALYST);

            when(userRepository.existsByEmail("dup@example.com")).thenReturn(true);

            assertThatThrownBy(() -> userService.createUser(req))
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).getErrorCode())
                    .isEqualTo(ErrorCode.CONFLICT);
        }

        @Test
        @DisplayName("throws VALIDATION_ERROR when password equals email")
        void passwordEqualsEmailThrowsValidation() {
            CreateUserRequest req = new CreateUserRequest();
            req.setEmail("same@example.com");
            req.setPassword("same@example.com");
            req.setFullName("User");
            req.setRole(Role.ANALYST);

            assertThatThrownBy(() -> userService.createUser(req))
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).getErrorCode())
                    .isEqualTo(ErrorCode.VALIDATION_ERROR);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // updateUser — normal updates
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateUser — normal updates")
    class UpdateUserNormalTests {

        @Test
        @DisplayName("updates name and department on a regular user")
        void updatesNameAndDepartment() {
            UUID uid = UUID.randomUUID();
            User analyst = activeAnalyst(uid);
            when(userRepository.findById(uid)).thenReturn(Optional.of(analyst));
            when(userRepository.save(analyst)).thenReturn(analyst);

            UpdateUserRequest req = new UpdateUserRequest();
            req.setFullName("Updated Name");
            req.setDepartment("Threat Intel");

            UserResponse result = userService.updateUser(uid, req);

            assertThat(result.getFullName()).isEqualTo("Updated Name");
            verify(userRepository).save(analyst);
            verifyNoInteractions(refreshTokenRepository);
        }

        @Test
        @DisplayName("throws NOT_FOUND when user does not exist")
        void notFoundThrows() {
            UUID uid = UUID.randomUUID();
            when(userRepository.findById(uid)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.updateUser(uid, new UpdateUserRequest()))
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).getErrorCode())
                    .isEqualTo(ErrorCode.NOT_FOUND);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // updateUser — deactivation + refresh-token revocation (Fix B1)
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateUser — deactivation revokes refresh tokens")
    class DeactivationRevokesTokensTests {

        @Test
        @DisplayName("revokeAllUserTokens called when active analyst is deactivated")
        void deactivatingAnalystRevokesTokens() {
            UUID uid = UUID.randomUUID();
            User analyst = activeAnalyst(uid);
            when(userRepository.findById(uid)).thenReturn(Optional.of(analyst));
            when(userRepository.save(analyst)).thenReturn(analyst);

            UpdateUserRequest req = new UpdateUserRequest();
            req.setActive(false);

            userService.updateUser(uid, req);

            verify(refreshTokenRepository).revokeAllUserTokens(uid);
            assertThat(analyst.isActive()).isFalse();
        }

        @Test
        @DisplayName("revokeAllUserTokens NOT called when active is set to true (re-activation)")
        void reactivatingDoesNotRevokeTokens() {
            UUID uid = UUID.randomUUID();
            User analyst = activeAnalyst(uid);
            analyst.setActive(false); // already inactive
            when(userRepository.findById(uid)).thenReturn(Optional.of(analyst));
            when(userRepository.save(analyst)).thenReturn(analyst);

            UpdateUserRequest req = new UpdateUserRequest();
            req.setActive(true);

            userService.updateUser(uid, req);

            verifyNoInteractions(refreshTokenRepository);
        }

        @Test
        @DisplayName("revokeAllUserTokens NOT called when active field is not set")
        void noActiveChangeDoesNotRevokeTokens() {
            UUID uid = UUID.randomUUID();
            User analyst = activeAnalyst(uid);
            when(userRepository.findById(uid)).thenReturn(Optional.of(analyst));
            when(userRepository.save(analyst)).thenReturn(analyst);

            UpdateUserRequest req = new UpdateUserRequest();
            req.setFullName("New Name"); // active not set

            userService.updateUser(uid, req);

            verifyNoInteractions(refreshTokenRepository);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // updateUser — last-admin lockout guard (Fix B2 / B3)
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateUser — last-admin lockout guard")
    class LastAdminGuardTests {

        @Test
        @DisplayName("throws VALIDATION_ERROR when deactivating the sole active ADMIN")
        void deactivatingLastAdminThrows() {
            UUID uid = UUID.randomUUID();
            User admin = activeAdmin(uid);
            when(userRepository.findById(uid)).thenReturn(Optional.of(admin));
            when(userRepository.countActiveAdmins()).thenReturn(1L);

            UpdateUserRequest req = new UpdateUserRequest();
            req.setActive(false);

            assertThatThrownBy(() -> userService.updateUser(uid, req))
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).getErrorCode())
                    .isEqualTo(ErrorCode.VALIDATION_ERROR)
                    .describedAs("Last-admin deactivation must be rejected");
        }

        @Test
        @DisplayName("throws VALIDATION_ERROR when downgrading the sole active ADMIN's role")
        void downgradingLastAdminRoleThrows() {
            UUID uid = UUID.randomUUID();
            User admin = activeAdmin(uid);
            when(userRepository.findById(uid)).thenReturn(Optional.of(admin));
            when(userRepository.countActiveAdmins()).thenReturn(1L);

            UpdateUserRequest req = new UpdateUserRequest();
            req.setRole(Role.ANALYST); // downgrade

            assertThatThrownBy(() -> userService.updateUser(uid, req))
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).getErrorCode())
                    .isEqualTo(ErrorCode.VALIDATION_ERROR);
        }

        @Test
        @DisplayName("allows deactivating an ADMIN when another active ADMIN exists")
        void deactivatingNonLastAdminAllowed() {
            UUID uid = UUID.randomUUID();
            User admin = activeAdmin(uid);
            when(userRepository.findById(uid)).thenReturn(Optional.of(admin));
            when(userRepository.countActiveAdmins()).thenReturn(2L);
            when(userRepository.save(admin)).thenReturn(admin);

            UpdateUserRequest req = new UpdateUserRequest();
            req.setActive(false);

            assertThatNoException().isThrownBy(() -> userService.updateUser(uid, req));
            verify(refreshTokenRepository).revokeAllUserTokens(uid);
        }

        @Test
        @DisplayName("allows role change from ADMIN when another active ADMIN exists")
        void roleChangeNonLastAdminAllowed() {
            UUID uid = UUID.randomUUID();
            User admin = activeAdmin(uid);
            when(userRepository.findById(uid)).thenReturn(Optional.of(admin));
            when(userRepository.countActiveAdmins()).thenReturn(2L);
            when(userRepository.save(admin)).thenReturn(admin);

            UpdateUserRequest req = new UpdateUserRequest();
            req.setRole(Role.ANALYST);

            assertThatNoException().isThrownBy(() -> userService.updateUser(uid, req));
        }

        @Test
        @DisplayName("last-admin guard is NOT triggered when changing non-admin fields on an ADMIN")
        void nonRoleNonActiveChangeOnAdminSkipsGuard() {
            UUID uid = UUID.randomUUID();
            User admin = activeAdmin(uid);
            when(userRepository.findById(uid)).thenReturn(Optional.of(admin));
            when(userRepository.save(admin)).thenReturn(admin);

            UpdateUserRequest req = new UpdateUserRequest();
            req.setFullName("New Admin Name");

            assertThatNoException().isThrownBy(() -> userService.updateUser(uid, req));
            verify(userRepository, never()).countActiveAdmins();
        }

        @Test
        @DisplayName("last-admin guard is NOT triggered for non-admin users")
        void guardNotTriggeredForNonAdmin() {
            UUID uid = UUID.randomUUID();
            User analyst = activeAnalyst(uid);
            when(userRepository.findById(uid)).thenReturn(Optional.of(analyst));
            when(userRepository.save(analyst)).thenReturn(analyst);

            UpdateUserRequest req = new UpdateUserRequest();
            req.setActive(false);

            assertThatNoException().isThrownBy(() -> userService.updateUser(uid, req));
            verify(userRepository, never()).countActiveAdmins();
            verify(refreshTokenRepository).revokeAllUserTokens(uid);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // updateUserSkills
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateUserSkills")
    class UpdateSkillsTests {

        @Test
        @DisplayName("deletes existing skills and saves new ones")
        void replacesSkillsSuccessfully() {
            UUID uid = UUID.randomUUID();
            UUID skillId = UUID.randomUUID();
            User analyst = activeAnalyst(uid);
            Skill skill = new Skill("Cloud Forensics");
            skill.setId(skillId);

            when(userRepository.findById(uid)).thenReturn(Optional.of(analyst));
            when(skillRepository.findById(skillId)).thenReturn(Optional.of(skill));

            UserSkillRequest req = new UserSkillRequest(skillId, 2);

            assertThatNoException().isThrownBy(() ->
                    userService.updateUserSkills(uid, List.of(req)));

            verify(userSkillRepository).deleteByUserId(uid);
            verify(userSkillRepository).save(any(UserSkill.class));
        }

        @Test
        @DisplayName("throws NOT_FOUND when skill ID does not exist")
        void unknownSkillIdThrowsNotFound() {
            UUID uid = UUID.randomUUID();
            UUID badSkillId = UUID.randomUUID();
            User analyst = activeAnalyst(uid);

            when(userRepository.findById(uid)).thenReturn(Optional.of(analyst));
            when(skillRepository.findById(badSkillId)).thenReturn(Optional.empty());

            UserSkillRequest req = new UserSkillRequest(badSkillId, 1);

            assertThatThrownBy(() -> userService.updateUserSkills(uid, List.of(req)))
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).getErrorCode())
                    .isEqualTo(ErrorCode.NOT_FOUND);
        }

        @Test
        @DisplayName("clears all skills when empty list is provided")
        void emptyListClearsSkills() {
            UUID uid = UUID.randomUUID();
            User analyst = activeAnalyst(uid);
            when(userRepository.findById(uid)).thenReturn(Optional.of(analyst));

            assertThatNoException().isThrownBy(() ->
                    userService.updateUserSkills(uid, List.of()));

            verify(userSkillRepository).deleteByUserId(uid);
            verify(userSkillRepository, never()).save(any());
        }
    }
}
