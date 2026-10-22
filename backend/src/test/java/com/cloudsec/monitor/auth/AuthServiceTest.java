package com.cloudsec.monitor.auth;

import com.cloudsec.monitor.auth.dto.LoginRequest;
import com.cloudsec.monitor.auth.AuthService.LoginResult;
import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.security.JwtService;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private MfaService mfaService;

    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtService, refreshTokenService, mfaService, 15);
        sampleUser = new User("admin@cloudsec.local", "encodedPassword", "Admin User", "SOC", Role.ADMIN);
    }

    @Test
    void login_Successful_ResetsFailedLoginCountAndReturnsTokens() {
        LoginRequest request = new LoginRequest("admin@cloudsec.local", "change-me");
        sampleUser.setFailedLoginCount(2);

        when(userRepository.findByEmail("admin@cloudsec.local")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("change-me", "encodedPassword")).thenReturn(true);
        when(jwtService.generateAccessToken(sampleUser.getId(), sampleUser.getEmail(), sampleUser.getRole())).thenReturn("valid.jwt.token");
        when(refreshTokenService.createRefreshToken(sampleUser)).thenReturn("refresh-uuid-token");

        LoginResult result = authService.login(request);

        assertNotNull(result);
        assertNotNull(result.response().getAccessToken());
        assertEquals("refresh-uuid-token", result.refreshToken());
        assertEquals(0, sampleUser.getFailedLoginCount());
        verify(userRepository).save(sampleUser);
    }

    @Test
    void login_FailedPassword_IncrementsFailedCount() {
        LoginRequest request = new LoginRequest("admin@cloudsec.local", "WrongPassword");
        sampleUser.setFailedLoginCount(2);

        when(userRepository.findByEmail("admin@cloudsec.local")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongPassword", "encodedPassword")).thenReturn(false);

        ApiException ex = assertThrows(ApiException.class, () -> authService.login(request));
        assertEquals(ErrorCode.UNAUTHENTICATED, ex.getErrorCode());
        assertEquals(3, sampleUser.getFailedLoginCount());
        assertNull(sampleUser.getLockedUntil());
        verify(userRepository).save(sampleUser);
    }

    @Test
    void login_FifthFailedAttempt_LocksAccountFor15Minutes() {
        LoginRequest request = new LoginRequest("admin@cloudsec.local", "WrongPassword");
        sampleUser.setFailedLoginCount(4); // 5th will lock it

        when(userRepository.findByEmail("admin@cloudsec.local")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongPassword", "encodedPassword")).thenReturn(false);

        ApiException ex = assertThrows(ApiException.class, () -> authService.login(request));
        assertEquals(ErrorCode.ACCOUNT_LOCKED, ex.getErrorCode());
        assertEquals(5, sampleUser.getFailedLoginCount());
        assertNotNull(sampleUser.getLockedUntil());
        assertTrue(sampleUser.getLockedUntil().isAfter(Instant.now()));
        verify(userRepository).save(sampleUser);
    }

    @Test
    void login_WhenAlreadyLocked_RejectsImmediately() {
        LoginRequest request = new LoginRequest("admin@cloudsec.local", "change-me");
        sampleUser.setFailedLoginCount(5);
        sampleUser.setLockedUntil(Instant.now().plus(10, ChronoUnit.MINUTES));

        when(userRepository.findByEmail("admin@cloudsec.local")).thenReturn(Optional.of(sampleUser));

        ApiException ex = assertThrows(ApiException.class, () -> authService.login(request));
        assertEquals(ErrorCode.ACCOUNT_LOCKED, ex.getErrorCode());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }
}
