package com.cloudsec.monitor.auth;

import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private RefreshTokenService refreshTokenService;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        refreshTokenService = new RefreshTokenService(refreshTokenRepository, 7, "dev");
        sampleUser = new User("alice@cloudsec.local", "hash", "Alice", "SOC", Role.ANALYST);
    }

    @Test
    void createRefreshToken_GeneratesRawTokenAndSavesHashedToken() {
        String rawToken = refreshTokenService.createRefreshToken(sampleUser);

        assertNotNull(rawToken);
        assertFalse(rawToken.isBlank());

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());

        RefreshToken saved = captor.getValue();
        assertEquals(sampleUser, saved.getUser());
        assertNotEquals(rawToken, saved.getTokenHash());
        assertFalse(saved.isRevoked());
        assertTrue(saved.getExpiresAt().isAfter(Instant.now()));
    }

    @Test
    void rotateRefreshToken_WhenTokenIsAlreadyRevoked_TriggersReuseDetectionAndRevokesAll() {
        String rawToken = "reused-token";
        RefreshToken revokedToken = new RefreshToken(sampleUser, "hash", Instant.now().plus(5, ChronoUnit.DAYS));
        revokedToken.setRevoked(true);

        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(revokedToken));

        ApiException ex = assertThrows(ApiException.class, () -> refreshTokenService.rotateRefreshToken(rawToken));
        assertEquals(ErrorCode.UNAUTHENTICATED, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("reuse detected"));

        verify(refreshTokenRepository).revokeAllUserTokens(sampleUser.getId());
    }

    @Test
    void rotateRefreshToken_WhenValid_RevokesOldAndIssuesNew() {
        String rawToken = "valid-active-token";
        RefreshToken activeToken = new RefreshToken(sampleUser, "hash", Instant.now().plus(5, ChronoUnit.DAYS));

        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(activeToken));

        RefreshTokenService.RefreshTokenResult result = refreshTokenService.rotateRefreshToken(rawToken);

        assertNotNull(result);
        assertEquals(sampleUser, result.user());
        assertNotNull(result.newRawToken());
        assertTrue(activeToken.isRevoked());
    }
}
