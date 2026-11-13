package com.cloudsecurity;

import java.sql.SQLException;

/**
 * Main application entry point for the Cloud Security Monitoring
 * and Incident Management System prototype.
 *
 * Workflow:
 * 1. Initialize SQLite database schema automatically.
 * 2. Instantiate system monitoring probe using OSHI.
 * 3. Sample 5 real hardware readings (CPU, RAM, Disk).
 * 4. Analyze each reading against demonstration thresholds (NORMAL vs HIGH_USAGE).
 * 5. Persist each reading to SQLite via JDBC PreparedStatement.
 * 6. Query and display stored records from the database for verification.
 *
 * Usage:
 * - Default (5 readings, 3s interval):  mvn exec:java
 * - Custom count and interval:          mvn exec:java -Dexec.args="10 2000"
 * - Query database only:                mvn exec:java -Dexec.args="query"
 */
public class SystemMonitor {

    private static final String DATABASE_FILE = "monitoring.db";
    private static final int DEFAULT_READINGS = 5;
    private static final long DEFAULT_INTERVAL_MS = 3000L; // 3 seconds between readings

    public static void main(String[] args) {
        printBanner();

        // 1. Initialize Database
        System.out.println("[Step 1/3] Initializing SQLite database connection...");
        DatabaseManager dbManager = new DatabaseManager(DATABASE_FILE);

        try {
            dbManager.initializeDatabase();
            System.out.println("[OK] Database schema verified (monitoring.db -> system_metrics table ready).");
        } catch (SQLException e) {
            System.err.println("[FATAL] Could not initialize database schema: " + e.getMessage());
            e.printStackTrace();
            return;
        }

        // Check if user requested query-only mode
        if (args.length >= 1 && (args[0].equalsIgnoreCase("query") || args[0].equalsIgnoreCase("-q"))) {
            int limit = 20;
            if (args.length >= 2) {
                try {
                    limit = Integer.parseInt(args[1]);
                } catch (NumberFormatException ignored) {}
            }
            System.out.println("\n[QUERY MODE] Inspecting SQLite database records...");
            dbManager.printStoredRecords(limit);
            printFooter();
            return;
        }

        // 2. Initialize Monitoring Service and Run Cycle
        System.out.println("\n[Step 2/3] Initializing Hardware Probes (OSHI)...");
        MonitoringService monitoringService = new MonitoringService();

        int readings = DEFAULT_READINGS;
        long interval = DEFAULT_INTERVAL_MS;

        // Allow overriding readings and interval via command line args if provided
        if (args.length >= 1) {
            try {
                readings = Integer.parseInt(args[0]);
            } catch (NumberFormatException ignored) {}
        }
        if (args.length >= 2) {
            try {
                interval = Long.parseLong(args[1]);
            } catch (NumberFormatException ignored) {}
        }

        // Run the collection and save cycle
        monitoringService.runMonitoringCycle(readings, interval, dbManager);

        // 3. Verify Database Records
        System.out.println("\n[Step 3/3] Verifying records stored in SQLite database...");
        dbManager.printStoredRecords(readings);

        printFooter();
    }

    private static void printBanner() {
        System.out.println("=========================================================================================");
        System.out.println("        CLOUD SECURITY MONITORING & INCIDENT MANAGEMENT SYSTEM - PROTOTYPE               ");
        System.out.println("=========================================================================================");
        System.out.printf("  Java Runtime : %s (%s)%n", System.getProperty("java.version"), System.getProperty("java.vendor"));
        System.out.printf("  Operating Sys: %s (Arch: %s)%n", System.getProperty("os.name"), System.getProperty("os.arch"));
        System.out.printf("  Database     : SQLite (%s)%n", DATABASE_FILE);
        System.out.println("=========================================================================================");
    }

    private static void printFooter() {
        System.out.println("Demonstration run completed successfully!");
        System.out.println("Records have been committed to SQLite file: monitoring.db");
      
    }
}
