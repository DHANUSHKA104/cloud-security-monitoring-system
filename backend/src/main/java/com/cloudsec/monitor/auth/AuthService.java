package com.cloudsec.monitor.auth;

import com.cloudsec.monitor.auth.dto.*;
import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.security.JwtService;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_MINUTES = 15;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final MfaService mfaService;
    private final long accessExpirationMinutes;

    // Cache for short-lived MFA pending sessions: mfaToken -> userId
    private final ConcurrentHashMap<String, MfaPendingSession> mfaPendingSessions = new ConcurrentHashMap<>();

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            MfaService mfaService,
            @Value("${app.jwt.access-token-expiration-minutes:15}") long accessExpirationMinutes
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.mfaService = mfaService;
        this.accessExpirationMinutes = accessExpirationMinutes;
    }

    @Transactional
    public UserResponse signup(SignupRequest request) {
        String pwd = request.getPassword() != null ? request.getPassword() : "";
        if (pwd.length() < 8 || pwd.length() > 72) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Password must be at least 8 characters");
        }
        if (!pwd.matches(".*[A-Z].*")) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Password must contain at least one capital letter (A-Z)");
        }
        if (!pwd.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?~`].*")) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Password must contain at least one special character (!@#$...)");
        }
        if (pwd.equalsIgnoreCase(request.getEmail())) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Password must be different from your email");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException(ErrorCode.CONFLICT, "A user with this email address already exists");
        }

        User user = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName(),
                null,
                Role.VIEWER // Self-signup creates VIEWER
        );

        User saved = userRepository.save(user);
        return UserResponse.from(saved);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public LoginResult login(LoginRequest request) {
        String identifier = request.getEmail() != null ? request.getEmail().trim() : "";
        Optional<User> userOpt = userRepository.findByEmail(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmailIgnoreCase(identifier);
        }
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByFullNameIgnoreCase(identifier);
        }

        if (userOpt.isEmpty()) {
            throw new ApiException(ErrorCode.UNAUTHENTICATED, "Invalid name/email or password");
        }

        User user = userOpt.get();

        // Check account lock
        if (user.getLockedUntil() != null) {
            if (Instant.now().isBefore(user.getLockedUntil())) {
                long minutesLeft = ChronoUnit.MINUTES.between(Instant.now(), user.getLockedUntil()) + 1;
                throw new ApiException(ErrorCode.ACCOUNT_LOCKED,
                        "Account locked, try again in " + minutesLeft + " minutes.");
            } else {
                // Lock expired, reset
                user.setLockedUntil(null);
                user.setFailedLoginCount(0);
            }
        }

        if (!user.isActive()) {
            throw new ApiException(ErrorCode.FORBIDDEN, "This account has been deactivated");
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            int newFailedCount = user.getFailedLoginCount() + 1;
            user.setFailedLoginCount(newFailedCount);

            if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
                user.setLockedUntil(Instant.now().plus(LOCKOUT_MINUTES, ChronoUnit.MINUTES));
                userRepository.saveAndFlush(user);
                throw new ApiException(ErrorCode.ACCOUNT_LOCKED,
                        "Account locked, try again in " + LOCKOUT_MINUTES + " minutes.");
            }

            userRepository.saveAndFlush(user);
            throw new ApiException(ErrorCode.UNAUTHENTICATED, "Invalid name/email or password");
        }

        // Successful password match -> Reset failed attempts
        user.setFailedLoginCount(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        // Check if MFA is enabled
        if (user.isMfaEnabled() && user.getMfaSecret() != null) {
            String mfaToken = UUID.randomUUID().toString();
            mfaPendingSessions.put(mfaToken, new MfaPendingSession(user.getId(), Instant.now().plus(5, ChronoUnit.MINUTES)));
            mfaService.logDevMfaCode(user.getEmail(), user.getMfaSecret());

            return new LoginResult(LoginResponse.mfaRequired(mfaToken), null);
        }

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = refreshTokenService.createRefreshToken(user);

        LoginResponse response = LoginResponse.success(accessToken, accessExpirationMinutes * 60, UserResponse.from(user));
        return new LoginResult(response, refreshToken);
    }

    @Transactional
    public LoginResult verifyMfa(MfaVerifyRequest request) {
        MfaPendingSession session = mfaPendingSessions.get(request.getMfaToken());

        if (session == null || session.expiresAt.isBefore(Instant.now())) {
            mfaPendingSessions.remove(request.getMfaToken());
            throw new ApiException(ErrorCode.UNAUTHENTICATED, "MFA authentication session expired. Please sign in again.");
        }

        User user = userRepository.findById(session.userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found"));

        if (!mfaService.verifyCode(user.getMfaSecret(), request.getCode())) {
            throw new ApiException(ErrorCode.UNAUTHENTICATED, "Invalid authentication code");
        }

        mfaPendingSessions.remove(request.getMfaToken());

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = refreshTokenService.createRefreshToken(user);

        LoginResponse response = LoginResponse.success(accessToken, accessExpirationMinutes * 60, UserResponse.from(user));
        return new LoginResult(response, refreshToken);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public LoginResult refreshToken(String cookieRefreshToken) {
        RefreshTokenService.RefreshTokenResult result = refreshTokenService.rotateRefreshToken(cookieRefreshToken);
        User user = result.user();

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        LoginResponse response = LoginResponse.success(accessToken, accessExpirationMinutes * 60, UserResponse.from(user));

        return new LoginResult(response, result.newRawToken());
    }

    @Transactional
    public void logout(String cookieRefreshToken) {
        refreshTokenService.revokeToken(cookieRefreshToken);
    }

    @Transactional
    public String enableMfa(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found"));

        String secret = mfaService.generateSecret();
        user.setMfaSecret(secret);
        user.setMfaEnabled(true);
        userRepository.save(user);

        mfaService.logDevMfaCode(user.getEmail(), secret);
        return secret;
    }

    @Transactional
    public void disableMfa(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found"));

        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        userRepository.save(user);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Current password is incorrect");
        }

        if (request.getNewPassword().equalsIgnoreCase(user.getEmail())) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Password must be at least 8 characters and different from your email");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public record LoginResult(LoginResponse response, String refreshToken) {}
    private record MfaPendingSession(UUID userId, Instant expiresAt) {}
}
