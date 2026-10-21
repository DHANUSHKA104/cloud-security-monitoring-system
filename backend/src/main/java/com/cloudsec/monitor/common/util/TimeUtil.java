package com.cloudsec.monitor.common.util;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

public final class TimeUtil {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_INSTANT;

    private TimeUtil() {}

    public static Instant now() {
        return Instant.now();
    }

    public static String formatIsoUtc(Instant instant) {
        if (instant == null) return null;
        return ISO_FORMATTER.format(instant);
    }

    public static Instant parseIso(String isoString) {
        if (isoString == null || isoString.isBlank()) return null;
        return Instant.parse(isoString);
    }
}
