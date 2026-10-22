package com.cloudsec.monitor.simulation;

import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.incident.dto.IncidentResponse;
import com.cloudsec.monitor.simulation.dto.SimHistoricalIncidentDto;
import com.cloudsec.monitor.simulation.dto.SimIncidentRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class SimulationController {

    private final SimulationService simulationService;
    private final String simApiKey;

    public SimulationController(
            SimulationService simulationService,
            @Value("${app.sim.api-key:cloudsec-sim-key}") String simApiKey
    ) {
        this.simulationService = simulationService;
        this.simApiKey = simApiKey;
    }

    private void validateSimKey(String providedKey) {
        if (providedKey == null || !providedKey.equals(simApiKey)) {
            throw new ApiException(ErrorCode.UNAUTHENTICATED, "Invalid or missing X-Sim-Key header");
        }
    }

    @PostMapping("/sim/incidents")
    public ResponseEntity<IncidentResponse> ingestIncident(
            @RequestHeader(value = "X-Sim-Key", required = false) String simKey,
            @Valid @RequestBody SimIncidentRequest request
    ) {
        validateSimKey(simKey);
        IncidentResponse response = simulationService.createSimulatedIncident(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/sim/seed")
    public ResponseEntity<Map<String, Object>> seedHistory(
            @RequestHeader(value = "X-Sim-Key", required = false) String simKey,
            @RequestBody List<SimHistoricalIncidentDto> batch
    ) {
        validateSimKey(simKey);
        int seeded = simulationService.seedHistoricalIncidents(batch);
        return ResponseEntity.ok(Map.of(
                "seeded", seeded,
                "message", "Historical incident batch ingested successfully"
        ));
    }

    @PostMapping("/demo/reset")
    public ResponseEntity<Map<String, String>> resetDemo(
            @RequestHeader(value = "X-Sim-Key", required = false) String simKey
    ) {
        validateSimKey(simKey);
        simulationService.resetDemoState();
        return ResponseEntity.ok(Map.of("message", "Demo state reset successfully"));
    }
}
