package com.cloudsecurity;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.sql.SQLException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SystemSecurityMonitorTest {

    private static final String TEST_DB = "test_monitoring.db";
    private DatabaseManager dbManager;

    @BeforeEach
    void setUp() throws SQLException {
        // Clean up previous test database if present
        File file = new File(TEST_DB);
        if (file.exists()) {
            file.delete();
        }
        dbManager = new DatabaseManager(TEST_DB);
        dbManager.initializeDatabase();
    }

    @AfterEach
    void tearDown() {
        File file = new File(TEST_DB);
        if (file.exists()) {
            file.delete();
        }
    }

    @Test
    @DisplayName("Verify threshold evaluation logic for NORMAL and HIGH_USAGE")
    void testThresholdEvaluation() {
        MonitoringService service = new MonitoringService();
        service.setCpuThresholdPercent(80.0);
        service.setRamThresholdPercent(80.0);
        service.setDiskThresholdPercent(90.0);

        // All below thresholds -> NORMAL
        assertEquals("NORMAL", service.evaluateStatus(45.0, 60.0, 70.0));

        // CPU exceeds threshold -> HIGH_USAGE
        assertEquals("HIGH_USAGE", service.evaluateStatus(85.0, 50.0, 60.0));

        // RAM exceeds threshold -> HIGH_USAGE
        assertEquals("HIGH_USAGE", service.evaluateStatus(30.0, 82.5, 40.0));

        // Disk exceeds threshold -> HIGH_USAGE
        assertEquals("HIGH_USAGE", service.evaluateStatus(20.0, 50.0, 92.0));
    }

    @Test
    @DisplayName("Verify SystemMetrics data model and byte-to-GB conversions")
    void testMetricsDataModel() {
        long gigabyte = 1024L * 1024L * 1024L;
        SystemMetrics metrics = new SystemMetrics(
                "DESKTOP-TEST",
                42.555,
                65.432,
                78.991,
                "C:\\",
                16L * gigabyte,
                8L * gigabyte,
                512L * gigabyte,
                256L * gigabyte,
                "NORMAL"
        );

        assertEquals("DESKTOP-TEST", metrics.getHostName());
        assertEquals(42.56, metrics.getCpuPercent(), 0.01);
        assertEquals(65.43, metrics.getRamPercent(), 0.01);
        assertEquals(16.0, metrics.getRamTotalGb(), 0.1);
        assertEquals(8.0, metrics.getRamUsedGb(), 0.1);
        assertEquals(512.0, metrics.getDiskTotalGb(), 0.1);
        assertEquals(256.0, metrics.getDiskUsedGb(), 0.1);
        assertEquals("NORMAL", metrics.getStatus());
    }

    @Test
    @DisplayName("Verify SQLite DatabaseManager creates table, inserts records, and queries them")
    void testDatabaseOperations() throws SQLException {
        assertEquals(0, dbManager.getRecordCount());

        SystemMetrics sample = new SystemMetrics(
                "TEST-HOST",
                35.5,
                72.0,
                55.0,
                "C:\\",
                1024L * 1024L * 1024L * 16,
                1024L * 1024L * 1024L * 11,
                1024L * 1024L * 1024L * 500,
                1024L * 1024L * 1024L * 250,
                "NORMAL"
        );

        int generatedId = dbManager.saveMetrics(sample);
        assertTrue(generatedId > 0, "Generated ID should be positive");
        assertEquals(1, dbManager.getRecordCount());

        List<SystemMetrics> records = dbManager.getRecentMetrics(5);
        assertEquals(1, records.size());
        assertEquals("TEST-HOST", records.get(0).getHostName());
        assertEquals(35.5, records.get(0).getCpuPercent(), 0.01);
        assertEquals("NORMAL", records.get(0).getStatus());
    }
}
