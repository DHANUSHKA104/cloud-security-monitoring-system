package com.cloudsec.monitor.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MfaCryptoConverterTest {

    private MfaCryptoConverter converter;

    @BeforeEach
    void setUp() {
        converter = new MfaCryptoConverter();
        converter.setEncryptionKey("test-aes-key-for-unit-testing-32-bytes!");
    }

    @Test
    void roundTrip_EncryptsAndDecryptsSuccessfully() {
        String secret = "JBSWY3DPEHPK3PXP";
        String encrypted = converter.convertToDatabaseColumn(secret);

        assertNotNull(encrypted);
        assertTrue(encrypted.startsWith("enc:v1:"));
        assertNotEquals(secret, encrypted);

        String decrypted = converter.convertToEntityAttribute(encrypted);
        assertEquals(secret, decrypted);
    }

    @Test
    void backwardCompatibility_PlaintextSecretReturnsAsIs() {
        String legacyPlaintext = "JBSWY3DPEHPK3PXP";
        String decrypted = converter.convertToEntityAttribute(legacyPlaintext);
        assertEquals(legacyPlaintext, decrypted);
    }

    @Test
    void nullAndBlankHandling() {
        assertNull(converter.convertToDatabaseColumn(null));
        assertNull(converter.convertToDatabaseColumn(""));
        assertNull(converter.convertToEntityAttribute(null));
        assertNull(converter.convertToEntityAttribute(""));
    }
}
