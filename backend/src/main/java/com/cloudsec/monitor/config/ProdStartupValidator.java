package com.cloudsec.monitor.config;

import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class ProdStartupValidator {

    private static final Logger log = LoggerFactory.getLogger(ProdStartupValidator.class);

    @Value("${ADMIN_INITIAL_PASSWORD:#{null}}")
    private String adminInitialPassword;

    @Value("${JWT_SECRET:#{null}}")
    private String jwtSecret;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ProdStartupValidator(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    public void validateAndInitialize() {
        if (adminInitialPassword == null || adminInitialPassword.trim().isEmpty() || "change-me".equalsIgnoreCase(adminInitialPassword)) {
            throw new IllegalStateException("Production startup aborted: ADMIN_INITIAL_PASSWORD environment variable is missing or set to default value.");
        }
        if (jwtSecret == null || jwtSecret.trim().isEmpty() || jwtSecret.contains("development")) {
            throw new IllegalStateException("Production startup aborted: JWT_SECRET environment variable is missing or using default development secret.");
        }

        // Initialize production admin if no users exist
        if (userRepository.count() == 0) {
            log.info("Production database empty: provisioning initial system administrator");
            User admin = new User(
                    "admin@cloudsec.local",
                    passwordEncoder.encode(adminInitialPassword),
                    "System Administrator",
                    Role.ADMIN
            );
            userRepository.save(admin);
            log.info("Initial administrator provisioned successfully.");
        }
    }
}
