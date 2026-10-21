package com.cloudsec.monitor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class CloudSecMonitorApplication {

    public static void main(String[] args) {
        // Enforce JVM time zone as UTC
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(CloudSecMonitorApplication.class, args);
    }
}
