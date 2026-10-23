package com.cloudsec.monitor.incident;

import com.cloudsec.monitor.common.dto.PageResponse;
import com.cloudsec.monitor.incident.dto.*;
import com.cloudsec.monitor.security.UserPrincipal;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;
    private final UserRepository userRepository;

    public IncidentController(IncidentService incidentService, UserRepository userRepository) {
        this.incidentService = incidentService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PageResponse<IncidentResponse>> getIncidents(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) IncidentPriority priority,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) UUID assigneeId,
            @RequestParam(required = false) UUID teamId,
            @RequestParam(required = false) String slaState,
            @RequestParam(required = false) Boolean escalatedToMe,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        String[] sortParts = sort.split(",");
        String sortProp = sortParts[0];
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortProp));
        UUID currentUserId = currentUser != null ? currentUser.getId() : null;

        return ResponseEntity.ok(incidentService.getIncidents(
                status, priority, category, assigneeId, teamId, slaState, escalatedToMe, q, pageRequest, currentUserId
        ));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<IncidentResponse> createIncident(
            @Valid @RequestBody CreateIncidentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        UUID creatorId = currentUser != null ? currentUser.getId() : null;
        IncidentResponse created = incidentService.createIncident(request, creatorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<IncidentDetailResponse> getIncidentById(@PathVariable UUID id) {
        return ResponseEntity.ok(incidentService.getIncidentById(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<IncidentResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        User actor = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        return ResponseEntity.ok(incidentService.updateStatus(id, request, actor));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<IncidentResponse> assignIncident(
            @PathVariable UUID id,
            @Valid @RequestBody AssignRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        User actor = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        return ResponseEntity.ok(incidentService.assignIncident(id, request, actor));
    }

    @PostMapping("/{id}/escalate")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<IncidentResponse> escalateIncident(
            @PathVariable UUID id,
            @Valid @RequestBody EscalateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        User actor = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        return ResponseEntity.ok(incidentService.escalateIncident(id, request, actor));
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> addComment(
            @PathVariable UUID id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        User actor = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        incidentService.addComment(id, request, actor);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/{id}/reopen")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<IncidentResponse> reopenIncident(
            @PathVariable UUID id,
            @Valid @RequestBody ReopenRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        User actor = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        return ResponseEntity.ok(incidentService.reopenIncident(id, request, actor));
    }

    @GetMapping("/{id}/timeline")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TimelineEventResponse>> getTimeline(@PathVariable UUID id) {
        return ResponseEntity.ok(incidentService.getTimeline(id));
    }
}


