package com.cloudsec.monitor.user;

import com.cloudsec.monitor.auth.RefreshTokenService;
import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.team.SkillRepository;
import com.cloudsec.monitor.team.TeamMemberRepository;
import com.cloudsec.monitor.team.UserSkillRepository;
import com.cloudsec.monitor.user.dto.UpdateUserRequest;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private UserSkillRepository userSkillRepository;

    @Mock
    private TeamMemberRepository teamMemberRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private EntityManager entityManager;

    @Mock
    private Query nativeQuery;

    private UserService userService;

    private User sampleAdmin;
    private User sampleAnalyst;

    @BeforeEach
    void setUp() {
        userService = new UserService(
                userRepository,
                skillRepository,
                userSkillRepository,
                teamMemberRepository,
                passwordEncoder,
                refreshTokenService,
                entityManager
        );

        sampleAdmin = new User("admin@cloudsec.local", "hash", "Admin User", "SOC", Role.ADMIN);
        sampleAdmin.setId(UUID.randomUUID());

        sampleAnalyst = new User("analyst@cloudsec.local", "hash", "Analyst User", "SOC", Role.ANALYST);
        sampleAnalyst.setId(UUID.randomUUID());
    }

    @Test
    void updateUser_DemoteLastAdmin_ThrowsConflict409() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setRole(Role.ANALYST);

        when(userRepository.findById(sampleAdmin.getId())).thenReturn(Optional.of(sampleAdmin));
        when(entityManager.createNativeQuery(anyString())).thenReturn(nativeQuery);
        when(nativeQuery.getResultList()).thenReturn(Collections.emptyList());
        when(userRepository.countActiveAdmins()).thenReturn(1L);

        ApiException ex = assertThrows(ApiException.class, () -> userService.updateUser(sampleAdmin.getId(), request));
        assertEquals(ErrorCode.CONFLICT, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Cannot deactivate or demote the last remaining active administrator"));
    }

    @Test
    void updateUser_DeactivateLastAdmin_ThrowsConflict409() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setActive(false);

        when(userRepository.findById(sampleAdmin.getId())).thenReturn(Optional.of(sampleAdmin));
        when(entityManager.createNativeQuery(anyString())).thenReturn(nativeQuery);
        when(nativeQuery.getResultList()).thenReturn(Collections.emptyList());
        when(userRepository.countActiveAdmins()).thenReturn(1L);

        ApiException ex = assertThrows(ApiException.class, () -> userService.updateUser(sampleAdmin.getId(), request));
        assertEquals(ErrorCode.CONFLICT, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Cannot deactivate or demote the last remaining active administrator"));
    }

    @Test
    void updateUser_DeactivateUserWhenNotLastAdmin_RevokesTokensAndDeactivates() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setActive(false);

        when(userRepository.findById(sampleAdmin.getId())).thenReturn(Optional.of(sampleAdmin));
        when(entityManager.createNativeQuery(anyString())).thenReturn(nativeQuery);
        when(nativeQuery.getResultList()).thenReturn(Collections.emptyList());
        when(userRepository.countActiveAdmins()).thenReturn(2L);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = userService.updateUser(sampleAdmin.getId(), request);

        assertNotNull(response);
        assertFalse(response.isActive());
        verify(refreshTokenService).revokeAllUserTokens(sampleAdmin.getId());
        verify(userRepository).save(sampleAdmin);
    }
}
