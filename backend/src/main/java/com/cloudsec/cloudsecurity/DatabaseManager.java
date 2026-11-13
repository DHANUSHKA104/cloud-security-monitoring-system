package com.cloudsecurity;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * DatabaseManager handles SQLite database connectivity, schema creation,
 * metric persistence, and verification queries using standard JDBC.
 */
public class DatabaseManager {

    private final String dbUrl;

    /**
     * Default constructor uses the local monitoring.db file in the project root.
     */
    public DatabaseManager() {
        this("monitoring.db");
    }

    /**
     * Constructor allowing a custom database file name or path (useful for testing).
     *
     * @param dbFileName Name or relative path of the SQLite database file.
     */
    public DatabaseManager(String dbFileName) {
        this.dbUrl = "jdbc:sqlite:" + dbFileName;
    }

    /**
     * Obtains a new connection to the SQLite database.
     * SQLite creates the database file automatically if it does not already exist.
     */
    public Connection getConnection() throws SQLException {
        return DriverManager.getConnection(dbUrl);
    }

    /**
     * Automatically creates the system_metrics table and indices if they do not exist.
     * Called when the application starts up.
     */
    public void initializeDatabase() throws SQLException {
        String createTableSql = """
            CREATE TABLE IF NOT EXISTS system_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recorded_at TEXT NOT NULL,
                hostname TEXT,
                cpu_percent REAL NOT NULL,
                ram_percent REAL NOT NULL,
                disk_percent REAL NOT NULL,
                disk_drive TEXT,
                total_ram_mb REAL,
                used_ram_mb REAL,
                status TEXT NOT NULL
            );
            """;

        String createIndexSql = """
            CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at
            ON system_metrics (recorded_at);
            """;

        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute(createTableSql);
            stmt.execute(createIndexSql);
        }
    }

    /**
     * Inserts a single SystemMetrics reading into the system_metrics table.
     * Uses PreparedStatement to guarantee security and proper data type mapping.
     *
     * @param metrics The collected system metrics snapshot.
     * @return The auto-generated primary key ID of the inserted record.
     */
    public int saveMetrics(SystemMetrics metrics) throws SQLException {
        String insertSql = """
            INSERT INTO system_metrics (
                recorded_at, hostname, cpu_percent, ram_percent, disk_percent,
                disk_drive, total_ram_mb, used_ram_mb, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """;

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {

            double totalRamMb = (double) metrics.getTotalRamBytes() / (1024 * 1024);
            double usedRamMb = (double) metrics.getUsedRamBytes() / (1024 * 1024);

            ps.setString(1, metrics.getRecordedAt());
            ps.setString(2, metrics.getHostName());
            ps.setDouble(3, metrics.getCpuPercent());
            ps.setDouble(4, metrics.getRamPercent());
            ps.setDouble(5, metrics.getDiskPercent());
            ps.setString(6, metrics.getDiskDrive());
            ps.setDouble(7, Math.round(totalRamMb * 100.0) / 100.0);
            ps.setDouble(8, Math.round(usedRamMb * 100.0) / 100.0);
            ps.setString(9, metrics.getStatus());

            int affectedRows = ps.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Inserting metrics failed, no rows affected.");
            }

            try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    int generatedId = generatedKeys.getInt(1);
                    metrics.setId(generatedId);
                    return generatedId;
                }
            }
        }
        return -1;
    }

    /**
     * Fetches the most recent metrics records from the database.
     *
     * @param limit Maximum number of records to retrieve.
     * @return List of SystemMetrics objects.
     */
    public List<SystemMetrics> getRecentMetrics(int limit) throws SQLException {
        String querySql = """
            SELECT id, recorded_at, hostname, cpu_percent, ram_percent, disk_percent,
                   disk_drive, total_ram_mb, used_ram_mb, status
            FROM system_metrics
            ORDER BY id DESC
            LIMIT ?;
            """;

        List<SystemMetrics> results = new ArrayList<>();

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(querySql)) {

            ps.setInt(1, limit);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    SystemMetrics m = new SystemMetrics();
                    m.setId(rs.getInt("id"));
                    m.setRecordedAt(rs.getString("recorded_at"));
                    m.setHostName(rs.getString("hostname"));
                    m.setCpuPercent(rs.getDouble("cpu_percent"));
                    m.setRamPercent(rs.getDouble("ram_percent"));
                    m.setDiskPercent(rs.getDouble("disk_percent"));
                    m.setDiskDrive(rs.getString("disk_drive"));

                    double totalRamMb = rs.getDouble("total_ram_mb");
                    double usedRamMb = rs.getDouble("used_ram_mb");
                    m.setTotalRamBytes((long) (totalRamMb * 1024 * 1024));
                    m.setUsedRamBytes((long) (usedRamMb * 1024 * 1024));
                    m.setAvailableRamBytes(m.getTotalRamBytes() - m.getUsedRamBytes());

                    m.setStatus(rs.getString("status"));
                    results.add(m);
                }
            }
        }
        return results;
    }

    /**
     * Returns total number of rows currently stored in system_metrics.
     */
    public int getRecordCount() throws SQLException {
        String countSql = "SELECT COUNT(*) FROM system_metrics;";
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(countSql)) {
            if (rs.next()) {
                return rs.getInt(1);
            }
        }
        return 0;
    }

    /**
     * Verification utility method: Queries and prints the stored database records
     * in a clean ASCII tabular format to the console.
     */
    public void printStoredRecords(int limit) {
        try {
            List<SystemMetrics> records = getRecentMetrics(limit);
            int totalCount = getRecordCount();

            System.out.println("\n=========================================================================================");
            System.out.printf("  DATABASE VERIFICATION REPORT (Showing %d of %d Total Records in SQLite)%n", records.size(), totalCount);
            System.out.println("=========================================================================================");
            System.out.printf("%-4s | %-19s | %-12s | %-8s | %-8s | %-14s | %-10s%n",
                    "ID", "Recorded At", "Hostname", "CPU %", "RAM %", "Disk", "Status");
            System.out.println("-----------------------------------------------------------------------------------------");

            for (SystemMetrics m : records) {
                String diskInfo = String.format("%.1f%% (%s)", m.getDiskPercent(), m.getDiskDrive());
                System.out.printf("%-4d | %-19s | %-12s | %6.2f%% | %6.2f%% | %-14s | %-10s%n",
                        m.getId(),
                        m.getRecordedAt(),
                        m.getHostName() != null ? m.getHostName() : "N/A",
                        m.getCpuPercent(),
                        m.getRamPercent(),
                        diskInfo,
                        m.getStatus());
            }
            System.out.println("=========================================================================================\n");

        } catch (SQLException e) {
            System.err.println("Failed to read database records: " + e.getMessage());
        }
    }
}
