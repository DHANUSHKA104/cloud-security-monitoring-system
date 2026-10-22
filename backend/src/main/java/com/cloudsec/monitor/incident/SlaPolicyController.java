package com.cloudsec.monitor.incident;

import com.cloudsec.monitor.incident.dto.SlaPolicyResponse;
import com.cloudsec.monitor.incident.dto.UpdateSlaPolicyRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sla-policies")
public class SlaPolicyController {

    private final SlaPolicyService slaPolicyService;

    public SlaPolicyController(SlaPolicyService slaPolicyService) {
        this.slaPolicyService = slaPolicyService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SlaPolicyResponse>> getPolicies() {
        return ResponseEntity.ok(slaPolicyService.getPolicies());
    }

    @PutMapping("/{priority}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SlaPolicyResponse> updatePolicy(
            @PathVariable IncidentPriority priority,
            @Valid @RequestBody UpdateSlaPolicyRequest request
    ) {
        return ResponseEntity.ok(slaPolicyService.updatePolicy(priority, request));
    }
}
