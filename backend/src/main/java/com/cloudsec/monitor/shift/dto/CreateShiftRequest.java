package com.cloudsec.monitor.shift.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public class CreateShiftRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotNull(message = "Shift start time is required")
    private Instant startsAt;

    @NotNull(message = "Shift end time is required")
    private Instant endsAt;

    public CreateShiftRequest() {}

    public CreateShiftRequest(UUID userId, Instant startsAt, Instant endsAt) {
        this.userId = userId;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public Instant getStartsAt() {
        return startsAt;
    }

    public void setStartsAt(Instant startsAt) {
        this.startsAt = startsAt;
    }

    public Instant getEndsAt() {
        return endsAt;
    }

    public void setEndsAt(Instant endsAt) {
        this.endsAt = endsAt;
    }
}
