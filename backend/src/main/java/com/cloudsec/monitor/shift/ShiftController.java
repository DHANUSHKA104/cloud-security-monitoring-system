package com.cloudsec.monitor.shift;

import com.cloudsec.monitor.security.UserPrincipal;
import com.cloudsec.monitor.shift.dto.CreateShiftRequest;
import com.cloudsec.monitor.shift.dto.HandoverResponse;
import com.cloudsec.monitor.shift.dto.ShiftResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/shifts")
public class ShiftController {

    private final ShiftService shiftService;
    private final HandoverService handoverService;

    public ShiftController(ShiftService shiftService, HandoverService handoverService) {
        this.shiftService = shiftService;
        this.handoverService = handoverService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<List<ShiftResponse>> getShifts(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        return ResponseEntity.ok(shiftService.getShifts(userId, from, to));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShiftResponse> createShift(
            @Valid @RequestBody CreateShiftRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        UUID adminId = currentUser != null ? currentUser.getId() : null;
        ShiftResponse shift = shiftService.createShift(request, adminId);
        return ResponseEntity.status(HttpStatus.CREATED).body(shift);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteShift(@PathVariable UUID id) {
        shiftService.deleteShift(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/on-now")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ShiftResponse>> getOnNow(@RequestParam(required = false) UUID teamId) {
        return ResponseEntity.ok(shiftService.getActiveShiftsOnNow(teamId));
    }

    @GetMapping("/handover")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<HandoverResponse> getHandover(@RequestParam(required = false) UUID teamId) {
        return ResponseEntity.ok(handoverService.generateHandover(teamId));
    }
}
