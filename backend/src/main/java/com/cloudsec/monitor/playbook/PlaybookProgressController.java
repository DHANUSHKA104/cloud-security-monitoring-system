
package com.cloudsec.monitor.playbook;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/playbooks/progress")
@PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
public class PlaybookProgressController {

    private final PlaybookStepTrackingService trackingService;

    public PlaybookProgressController(
            PlaybookStepTrackingService trackingService) {
        this.trackingService = trackingService;
    }

    @PatchMapping("/{stepId}")
    public ResponseEntity<PlaybookStepProgress> updateStatus(
            @PathVariable Long stepId,
            @RequestBody UpdateStepStatusRequest request) {

        PlaybookStepProgress updated =
                trackingService.updateStatus(
                        stepId, request.getStatus());

        return ResponseEntity.ok(updated);
    }

    @GetMapping("/execution/{executionId}")
    public ResponseEntity<List<PlaybookStepProgress>> getSteps(
            @PathVariable Long executionId) {

        return ResponseEntity.ok(
                trackingService.getStepsByExecutionId(executionId));
    }

    @GetMapping("/summary/{executionId}")
    public ResponseEntity<Map<String, Object>> getProgressSummary(
            @PathVariable Long executionId) {

        return ResponseEntity.ok(
                trackingService.getProgressSummary(executionId));
    }
}
