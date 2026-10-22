package com.cloudsec.monitor.shift.dto;

import com.cloudsec.monitor.shift.Shift;

import java.time.Instant;
import java.util.UUID;

public class ShiftResponse {
    private UUID id;
    private UUID userId;
    private String userFullName;
    private Instant startsAt;
    private Instant endsAt;

    public ShiftResponse() {}

    public static ShiftResponse from(Shift shift) {
        ShiftResponse res = new ShiftResponse();
        res.id = shift.getId();
        res.userId = shift.getUser().getId();
        res.userFullName = shift.getUser().getFullName();
        res.startsAt = shift.getStartsAt();
        res.endsAt = shift.getEndsAt();
        return res;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getUserFullName() {
        return userFullName;
    }

    public void setUserFullName(String userFullName) {
        this.userFullName = userFullName;
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
