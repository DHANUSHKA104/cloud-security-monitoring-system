package com.cloudsec.monitor.team;

import com.cloudsec.monitor.team.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public ResponseEntity<List<TeamResponse>> getTeams() {
        return ResponseEntity.ok(teamService.getTeams());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TeamResponse> createTeam(@Valid @RequestBody CreateTeamRequest request) {
        TeamResponse created = teamService.createTeam(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TeamResponse> updateTeam(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTeamRequest request
    ) {
        return ResponseEntity.ok(teamService.updateTeam(id, request));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<TeamMemberResponse>> getTeamMembers(@PathVariable UUID id) {
        return ResponseEntity.ok(teamService.getTeamMembers(id));
    }

    @PutMapping("/{id}/members/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> setTeamMember(
            @PathVariable UUID id,
            @PathVariable UUID userId,
            @Valid @RequestBody TeamMemberRequest request
    ) {
        teamService.setTeamMember(id, userId, request.getTeamRole());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeTeamMember(
            @PathVariable UUID id,
            @PathVariable UUID userId
    ) {
        teamService.removeTeamMember(id, userId);
        return ResponseEntity.noContent().build();
    }
}
