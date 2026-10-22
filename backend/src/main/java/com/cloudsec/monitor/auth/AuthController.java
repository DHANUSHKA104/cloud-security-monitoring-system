package com.cloudsec.monitor.auth;

import com.cloudsec.monitor.auth.dto.*;
import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.security.UserPrincipal;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;

    public AuthController(
            AuthService authService,
            RefreshTokenService refreshTokenService,
            UserRepository userRepository
    ) {
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
        this.userRepository = userRepository;
    }

    @PostMapping("/signup")
    public ResponseEntity<UserResponse> signup(@Valid @RequestBody SignupRequest request) {
        UserResponse response = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse servletResponse
    ) {
        AuthService.LoginResult result = authService.login(request);

        if (result.refreshToken() != null) {
            ResponseCookie cookie = refreshTokenService.createRefreshCookie(result.refreshToken());
            servletResponse.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }

        return ResponseEntity.ok(result.response());
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<LoginResponse> verifyMfa(
            @Valid @RequestBody MfaVerifyRequest request,
            HttpServletResponse servletResponse
    ) {
        AuthService.LoginResult result = authService.verifyMfa(request);

        if (result.refreshToken() != null) {
            ResponseCookie cookie = refreshTokenService.createRefreshCookie(result.refreshToken());
            servletResponse.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }

        return ResponseEntity.ok(result.response());
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(
            @CookieValue(name = "refresh_token", required = false) String refreshToken,
            HttpServletResponse servletResponse
    ) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ApiException(ErrorCode.UNAUTHENTICATED, "Refresh token cookie is missing");
        }

        AuthService.LoginResult result = authService.refreshToken(refreshToken);
        ResponseCookie cookie = refreshTokenService.createRefreshCookie(result.refreshToken());
        servletResponse.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(result.response());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "refresh_token", required = false) String refreshToken,
            HttpServletResponse servletResponse
    ) {
        authService.logout(refreshToken);
        ResponseCookie cleanCookie = refreshTokenService.createCleanRefreshCookie();
        servletResponse.addHeader(HttpHeaders.SET_COOKIE, cleanCookie.toString());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw new ApiException(ErrorCode.UNAUTHENTICATED, "Full authentication is required to access this resource");
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found"));

        return ResponseEntity.ok(UserResponse.from(user));
    }

    @PostMapping("/mfa/enable")
    public ResponseEntity<Map<String, String>> enableMfa(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw new ApiException(ErrorCode.UNAUTHENTICATED, "Full authentication is required to access this resource");
        }

        String secret = authService.enableMfa(principal.getId());
        return ResponseEntity.ok(Map.of("secret", secret));
    }

    @PostMapping("/mfa/disable")
    public ResponseEntity<Void> disableMfa(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw new ApiException(ErrorCode.UNAUTHENTICATED, "Full authentication is required to access this resource");
        }

        authService.disableMfa(principal.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        if (principal == null) {
            throw new ApiException(ErrorCode.UNAUTHENTICATED, "Full authentication is required to access this resource");
        }

        authService.changePassword(principal.getId(), request);
        return ResponseEntity.noContent().build();
    }
}
