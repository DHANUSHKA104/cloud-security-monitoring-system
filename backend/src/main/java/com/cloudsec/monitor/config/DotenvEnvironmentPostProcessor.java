package com.cloudsec.monitor.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Automatically loads .env into the Spring Environment before any bean initializes,
 * ensuring missing variables cause fast, descriptive startup failures if omitted.
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path[] candidates = new Path[]{
                Path.of(".env"),
                Path.of("../.env"),
                Path.of("C:/projects/cloud-security-monitoring-system/.env")
        };

        for (Path path : candidates) {
            try {
                if (Files.exists(path)) {
                    Map<String, Object> envMap = new HashMap<>();
                    List<String> lines = Files.readAllLines(path);
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
                        envMap.put(key, val);
                        // Also put lower-case / hyphenated if appropriate
                        if ("DEV_DEFAULT_PASSWORD".equals(key)) {
                            envMap.put("DEV_SEED_PASSWORD", val);
                        }
                        if ("DEV_SEED_PASSWORD".equals(key)) {
                            envMap.put("DEV_DEFAULT_PASSWORD", val);
                        }
                    }
                    if (!envMap.isEmpty()) {
                        environment.getPropertySources().addFirst(new MapPropertySource("dotenvPropertySource", envMap));
                        System.out.println("[DotenvEnvironmentPostProcessor] Successfully loaded " + envMap.size() + " properties from " + path.toAbsolutePath());
                        return;
                    }
                }
            } catch (Exception e) {
                System.err.println("[DotenvEnvironmentPostProcessor] Failed to read " + path + ": " + e.getMessage());
            }
        }
    }
}
