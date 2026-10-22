package com.cloudsec.monitor.team;

import com.cloudsec.monitor.team.dto.SkillRequest;
import com.cloudsec.monitor.team.dto.SkillResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
public class SkillController {

    private final TeamService teamService;

    public SkillController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public ResponseEntity<List<SkillResponse>> getSkills() {
        return ResponseEntity.ok(teamService.getSkills());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SkillResponse> createSkill(@Valid @RequestBody SkillRequest request) {
        SkillResponse created = teamService.createSkill(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
