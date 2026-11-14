package com.cloudsec.monitor.playbook;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/playbooks/executions")
@PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
public class PlaybookExecutionController {

    private final PlaybookExecutionService executionService;

    public PlaybookExecutionController(
            PlaybookExecutionService executionService) {
        this.executionService = executionService;
    }

    // Create a new playbook execution
    @PostMapping
    public ResponseEntity<PlaybookExecution> createExecution(
            @RequestBody CreatePlaybookExecutionRequest request) {

        PlaybookExecution execution = executionService.createExecution(
                request.getCategory(),
                request.getIncidentId());

        return ResponseEntity.ok(execution);
    }

    // Get all execution history
    @GetMapping
    public ResponseEntity<List<PlaybookExecution>> getExecutionHistory() {
        return ResponseEntity.ok(
                executionService.getExecutionHistory());
    }

    // Get execution history for a particular incident
    @GetMapping("/incident/{incidentId}")
    public ResponseEntity<List<PlaybookExecution>> getHistoryByIncident(
            @PathVariable UUID incidentId) {

        return ResponseEntity.ok(
                executionService.getExecutionHistoryByIncident(incidentId));
    }

    // Update execution status
    @PatchMapping("/{executionId}/status")
    public ResponseEntity<PlaybookExecution> updateExecutionStatus(
            @PathVariable Long executionId,
            @RequestBody UpdateExecutionStatusRequest request) {

        PlaybookExecution updated = executionService.updateExecutionStatus(
                executionId,
                request.getStatus());

        return ResponseEntity.ok(updated);
    }
}