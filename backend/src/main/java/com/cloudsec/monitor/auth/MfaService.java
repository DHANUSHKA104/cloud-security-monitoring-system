package com.cloudsec.monitor.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
public class MfaService {

    private static final Logger log = LoggerFactory.getLogger(MfaService.class);
    private static final int TIME_STEP_SECONDS = 30;
    private static final int CODE_DIGITS = 6;
    private static final int MODULUS = 1_000_000;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    private final SecureRandom secureRandom = new SecureRandom();

    public String generateSecret() {
        byte[] buffer = new byte[20];
        secureRandom.nextBytes(buffer);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
    }

    public boolean verifyCode(String secret, String code) {
        if (secret == null || code == null || code.length() != CODE_DIGITS) {
            return false;
        }

        try {
            int inputCode = Integer.parseInt(code);
            long currentWindow = Instant.now().getEpochSecond() / TIME_STEP_SECONDS;

            // Check current window and +/- 1 window for clock skew tolerance
            for (long i = -1; i <= 1; i++) {
                int expected = generateTotp(secret, currentWindow + i);
                if (expected == inputCode) {
                    return true;
                }
            }
        } catch (NumberFormatException e) {
            return false;
        }

        return false;
    }

    public void logDevMfaCode(String email, String secret) {
        if ("dev".equalsIgnoreCase(activeProfile)) {
            long currentWindow = Instant.now().getEpochSecond() / TIME_STEP_SECONDS;
            int code = generateTotp(secret, currentWindow);
            log.info("\n======================================================\n[DEV MFA CODE] User: {} -> Current 6-digit Code: {}\n======================================================",
                    email, String.format("%06d", code));
        }
    }

    private int generateTotp(String secret, long timeWindow) {
        try {
            byte[] keyBytes = Base64.getUrlDecoder().decode(secret);
            byte[] data = ByteBuffer.allocate(8).putLong(timeWindow).array();

            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(keyBytes, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);

            int offset = hash[hash.length - 1] & 0xf;
            int binary = ((hash[offset] & 0x7f) << 24)
                    | ((hash[offset + 1] & 0xff) << 16)
                    | ((hash[offset + 2] & 0xff) << 8)
                    | (hash[offset + 3] & 0xff);

            return binary % MODULUS;
        } catch (Exception e) {
            throw new RuntimeException("Error computing TOTP", e);
        }
    }
}
