package com.cloudsec.monitor.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

@Converter
@Component
public class MfaCryptoConverter implements AttributeConverter<String, String> {

    private static final String PREFIX = "enc:v1:";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static volatile String configuredKey = "c8f1e29a4b3d7e5c6a8b0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a";

    @Value("${app.mfa.encryption-key:${app.jwt.secret:c8f1e29a4b3d7e5c6a8b0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a}}")
    public void setEncryptionKey(String key) {
        if (key != null && !key.isBlank()) {
            configuredKey = key;
        }
    }

    private static SecretKeySpec getKeySpec() {
        try {
            byte[] keyBytes = configuredKey.getBytes(StandardCharsets.UTF_8);
            if (keyBytes.length != 32) {
                MessageDigest sha = MessageDigest.getInstance("SHA-256");
                keyBytes = sha.digest(keyBytes);
            }
            return new SecretKeySpec(keyBytes, "AES");
        } catch (Exception e) {
            throw new IllegalStateException("Failed to derive AES-256 key for MFA", e);
        }
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isBlank()) {
            return null;
        }
        if (attribute.startsWith(PREFIX)) {
            return attribute;
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            SECURE_RANDOM.nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, getKeySpec(), new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] encrypted = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);

            return PREFIX + Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt MFA secret", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        if (!dbData.startsWith(PREFIX)) {
            // Legacy / unencrypted value support
            return dbData;
        }
        try {
            byte[] combined = Base64.getDecoder().decode(dbData.substring(PREFIX.length()));
            byte[] iv = Arrays.copyOfRange(combined, 0, GCM_IV_LENGTH);
            byte[] cipherText = Arrays.copyOfRange(combined, GCM_IV_LENGTH, combined.length);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, getKeySpec(), new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] decrypted = cipher.doFinal(cipherText);

            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to decrypt MFA secret", e);
        }
    }
}
