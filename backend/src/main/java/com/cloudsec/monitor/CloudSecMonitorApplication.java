package com.cloudsec.monitor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class CloudSecMonitorApplication {

    public static void main(String[] args) {
        // Enforce JVM time zone as UTC
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        loadDotenv();
        SpringApplication.run(CloudSecMonitorApplication.class, args);
    }

    private static void loadDotenv() {
        Path[] candidates = new Path[]{
                Path.of(".env"),
                Path.of("../.env"),
                Path.of("C:/projects/cloud-security-monitoring-system/.env")
        };
        for (Path p : candidates) {
            try {
                if (Files.exists(p)) {
                    List<String> lines = Files.readAllLines(p);
                    for (String line : lines) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                            continue;
                        }
                        int eq = line.indexOf('=');
                        String key = line.substring(0, eq).trim();
                        String val = line.substring(eq + 1).trim();
                        if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                            val = val.substring(1, val.length() - 1);
                        }
                        if (System.getProperty(key) == null && System.getenv(key) == null) {
                            System.setProperty(key, val);
                        }
                        if ("DEV_DEFAULT_PASSWORD".equals(key)) {
                            if (System.getProperty("DEV_SEED_PASSWORD") == null && System.getenv("DEV_SEED_PASSWORD") == null) {
                                System.setProperty("DEV_SEED_PASSWORD", val);
                            }
                        }
                        if ("DEV_SEED_PASSWORD".equals(key)) {
                            if (System.getProperty("DEV_DEFAULT_PASSWORD") == null && System.getenv("DEV_DEFAULT_PASSWORD") == null) {
                                System.setProperty("DEV_DEFAULT_PASSWORD", val);
                            }
                        }
                    }
                    System.out.println("[Dotenv] Loaded configuration from " + p.toAbsolutePath());
                    break;
                }
            } catch (Exception ignored) {
            }
        }
    }
}
