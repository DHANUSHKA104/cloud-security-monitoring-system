package com.cloudsec.monitor.simulation;

import com.cloudsec.monitor.incident.*;
import com.cloudsec.monitor.incident.dto.CreateIncidentRequest;
import com.cloudsec.monitor.incident.dto.IncidentResponse;
import com.cloudsec.monitor.simulation.dto.SimHistoricalIncidentDto;
import com.cloudsec.monitor.simulation.dto.SimIncidentRequest;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SimulationService {

    private static final Logger log = LoggerFactory.getLogger(SimulationService.class);

    private final IncidentService incidentService;
    private final IncidentRepository incidentRepository;
    private final IncidentEventRepository incidentEventRepository;
    private final UserRepository userRepository;

    public SimulationService(
            IncidentService incidentService,
            IncidentRepository incidentRepository,
            IncidentEventRepository incidentEventRepository,
            UserRepository userRepository
    ) {
        this.incidentService = incidentService;
        this.incidentRepository = incidentRepository;
        this.incidentEventRepository = incidentEventRepository;
        this.userRepository = userRepository;
    }

    public IncidentResponse createSimulatedIncident(SimIncidentRequest request) {
        CreateIncidentRequest createReq = new CreateIncidentRequest();
        createReq.setTitle(request.getTitle());
        createReq.setDescription(request.getDescription());
        createReq.setPriority(request.getPriority());
        createReq.setCategory(request.getCategory());
        createReq.setTeamId(request.getTeamId());

        // Use IncidentService to create and auto-route via SmartRoutingService
        IncidentResponse created = incidentService.createIncident(createReq, null);

        // Update optional assetId and riskScore if provided
        if (request.getAssetId() != null || request.getRiskScore() != null) {
            Incident incident = incidentRepository.findById(created.getId()).orElse(null);
            if (incident != null) {
                if (request.getAssetId() != null) {
                    incident.setAssetId(request.getAssetId());
                }
                if (request.getRiskScore() != null) {
                    incident.setRiskScore(request.getRiskScore());
                }
                incident = incidentRepository.save(incident);
                return IncidentResponse.from(incident);
            }
        }

        return created;
    }

    public int seedHistoricalIncidents(List<SimHistoricalIncidentDto> batch) {
        int seeded = 0;
        List<User> analysts = userRepository.findByRole(Role.ANALYST);
        User defaultAnalyst = analysts.isEmpty() ? null : analysts.get(0);

        for (SimHistoricalIncidentDto dto : batch) {
            if (dto.getCode() != null && incidentRepository.existsByCode(dto.getCode())) {
                continue;
            }

            User assignee = null;
            if (dto.getAssigneeEmail() != null) {
                assignee = userRepository.findByEmail(dto.getAssigneeEmail()).orElse(defaultAnalyst);
            } else {
                assignee = defaultAnalyst;
            }

            Incident incident = new Incident();
            if (dto.getCode() != null) {
                incident.setCode(dto.getCode());
            } else {
                incident.setCode(incidentService.generateIncidentCode());
            }
            incident.setTitle(dto.getTitle());
            incident.setDescription(dto.getDescription());
            incident.setPriority(dto.getPriority() != null ? dto.getPriority() : IncidentPriority.P3);
            incident.setStatus(dto.getStatus() != null ? dto.getStatus() : IncidentStatus.RESOLVED);
            incident.setCategory(dto.getCategory() != null ? dto.getCategory() : "OTHER");
            incident.setAssetId(dto.getAssetId());
            incident.setRiskScore(dto.getRiskScore());
            incident.setAssignee(assignee);

            Instant created = dto.getCreatedAt() != null ? dto.getCreatedAt() : Instant.now().minus(Duration.ofDays(7));
            incident.setCreatedAt(created);

            Instant acknowledged = dto.getAcknowledgedAt() != null ? dto.getAcknowledgedAt() : created.plus(Duration.ofMinutes(5));
            incident.setAcknowledgedAt(acknowledged);

            Instant resolved = dto.getResolvedAt() != null ? dto.getResolvedAt() : created.plus(Duration.ofMinutes(35));
            incident.setResolvedAt(resolved);

            Instant slaDue = dto.getSlaDueAt() != null ? dto.getSlaDueAt() : created.plus(Duration.ofHours(4));
            incident.setSlaDueAt(slaDue);

            Incident saved = incidentRepository.save(incident);

            // Audit events
            incidentEventRepository.save(new IncidentEvent(saved, "CREATED", null, "{\"simulated\": true}"));
            if (saved.getStatus() == IncidentStatus.RESOLVED || saved.getStatus() == IncidentStatus.CLOSED) {
                incidentEventRepository.save(new IncidentEvent(saved, "STATUS_CHANGED", null, "{\"from\": \"OPEN\", \"to\": \"" + saved.getStatus().name() + "\", \"note\": \"Simulated resolution recorded\"}"));
            }

            seeded++;
        }

        log.info("Historical seed ingested {} incidents successfully", seeded);
        return seeded;
    }

    public void resetDemoState() {
        log.info("Resetting demo state...");
        incidentEventRepository.deleteAll();
        incidentRepository.deleteAll();

        // Re-create baseline demo incidents
        CreateIncidentRequest inc1 = new CreateIncidentRequest();
        inc1.setTitle("Repeated failed logins on admin account");
        inc1.setDescription("17 failed authentication attempts across 3 external IPs in 2 minutes");
        inc1.setPriority(IncidentPriority.P1);
        inc1.setCategory("AUTH_ATTACK");
        createSimulatedIncident(new SimIncidentRequest(
                inc1.getTitle(), inc1.getDescription(), inc1.getPriority(), inc1.getCategory(),
                "auth-broker-01.us-east.corp", 88, null
        ));

        CreateIncidentRequest inc2 = new CreateIncidentRequest();
        inc2.setTitle("Anomalous outbound SSH session detected");
        inc2.setDescription("Unusual high-volume port 22 tunnel to external unknown CIDR range");
        inc2.setPriority(IncidentPriority.P2);
        inc2.setCategory("NETWORK_INTRUSION");
        createSimulatedIncident(new SimIncidentRequest(
                inc2.getTitle(), inc2.getDescription(), inc2.getPriority(), inc2.getCategory(),
                "edge-gw-02.eu-west.corp", 62, null
        ));

        log.info("Demo state reset to clean baseline with 2 active incidents");
    }
}
