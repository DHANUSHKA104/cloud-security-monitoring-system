package com.cloudsec.monitor.auth;

import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.user.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final long refreshExpirationDays;
    private final String activeProfile;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            @Value("${app.jwt.refresh-token-expiration-days:7}") long refreshExpirationDays,
            @Value("${spring.profiles.active:dev}") String activeProfile
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshExpirationDays = refreshExpirationDays;
        this.activeProfile = activeProfile;
    }

    @Transactional
    public String createRefreshToken(User user) {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        String tokenHash = hashToken(rawToken);
        Instant expiresAt = Instant.now().plus(refreshExpirationDays, ChronoUnit.DAYS);

        RefreshToken refreshToken = new RefreshToken(user, tokenHash, expiresAt);
        refreshTokenRepository.save(refreshToken);

        return rawToken;
    }

    @Transactional(noRollbackFor = ApiException.class)
    public RefreshTokenResult rotateRefreshToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ApiException(ErrorCode.UNAUTHENTICATED, "Refresh token is missing");
        }

        String tokenHash = hashToken(rawToken);
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByTokenHash(tokenHash);

        if (tokenOpt.isEmpty()) {
            throw new ApiException(ErrorCode.UNAUTHENTICATED, "Invalid refresh token");
        }

        RefreshToken oldToken = tokenOpt.get();

        // If an already revoked token is used, reuse detection triggers: revoke whole chain!
        if (oldToken.isRevoked()) {
            refreshTokenRepository.revokeAllUserTokens(oldToken.getUser().getId());
            throw new ApiException(ErrorCode.UNAUTHENTICATED, "Revoked refresh token reuse detected. Session terminated.");
        }

        if (oldToken.getExpiresAt().isBefore(Instant.now())) {
            oldToken.setRevoked(true);
            refreshTokenRepository.save(oldToken);
            throw new ApiException(ErrorCode.UNAUTHENTICATED, "Refresh token has expired");
        }

        // Mark old token revoked and issue new pair
        oldToken.setRevoked(true);
        User user = oldToken.getUser();

        String newRawToken = createRefreshToken(user);
        oldToken.setReplacedBy(refreshTokenRepository.findByTokenHash(hashToken(newRawToken)).map(RefreshToken::getId).orElse(null));
        refreshTokenRepository.save(oldToken);

        return new RefreshTokenResult(user, newRawToken);
    }

    @Transactional
    public void revokeToken(String rawToken) {
        if (rawToken != null && !rawToken.isBlank()) {
            String tokenHash = hashToken(rawToken);
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
        }
    }

    public ResponseCookie createRefreshCookie(String refreshToken) {
        boolean isProd = "prod".equalsIgnoreCase(activeProfile);
        return ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(isProd)
                .path("/api/auth")
                .maxAge(refreshExpirationDays * 24 * 60 * 60)
                .sameSite("Lax")
                .build();
    }

    public ResponseCookie createCleanRefreshCookie() {
        boolean isProd = "prod".equalsIgnoreCase(activeProfile);
        return ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(isProd)
                .path("/api/auth")
                .maxAge(0)
                .sameSite("Lax")
                .build();
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm missing", e);
        }
    }

    public record RefreshTokenResult(User user, String newRawToken) {}
}

