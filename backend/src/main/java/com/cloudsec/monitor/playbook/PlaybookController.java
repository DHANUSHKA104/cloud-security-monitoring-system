package com.cloudsec.monitor.playbook;

import com.cloudsec.monitor.playbook.dto.*;
import com.cloudsec.monitor.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class PlaybookController {

    private final PlaybookService playbookService;

    public PlaybookController(PlaybookService playbookService) {
        this.playbookService = playbookService;
    }

    @GetMapping("/api/playbooks")
    @PreAuthorize("hasAnyRole('VIEWER', 'ANALYST', 'ADMIN')")
    public ResponseEntity<List<PlaybookResponse>> getAllPlaybooks() {
        return ResponseEntity.ok(playbookService.getAllPlaybooks());
    }

    @GetMapping("/api/playbooks/category/{category}")
    @PreAuthorize("hasAnyRole('VIEWER', 'ANALYST', 'ADMIN')")
    public ResponseEntity<PlaybookResponse> getPlaybookByCategory(@PathVariable String category) {
        return ResponseEntity.ok(playbookService.getPlaybookByCategory(category));
    }

    @GetMapping("/api/incidents/{incidentId}/playbook")
    @PreAuthorize("hasAnyRole('VIEWER', 'ANALYST', 'ADMIN')")
    public ResponseEntity<IncidentPlaybookStatusResponse> getPlaybookForIncident(@PathVariable UUID incidentId) {
        return ResponseEntity.ok(playbookService.getPlaybookForIncident(incidentId));
    }

    @PostMapping("/api/incidents/{incidentId}/playbook/steps/{stepId}/execute")
    @PreAuthorize("hasAnyRole('ANALYST', 'ADMIN')")
    public ResponseEntity<ExecutePlaybookStepResponse> executeStep(
            @PathVariable UUID incidentId,
            @PathVariable UUID stepId,
            @Valid @RequestBody ExecutePlaybookStepRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        ExecutePlaybookStepResponse response = playbookService.executeStep(
                incidentId,
                stepId,
                request,
                userPrincipal.getId()
        );
        return ResponseEntity.ok(response);
    }
}
