package com.cloudsec.monitor.simulation;

import com.cloudsec.monitor.incident.Incident;
import com.cloudsec.monitor.incident.IncidentEventRepository;
import com.cloudsec.monitor.incident.IncidentPriority;
import com.cloudsec.monitor.incident.IncidentRepository;
import com.cloudsec.monitor.incident.IncidentService;
import com.cloudsec.monitor.incident.IncidentStatus;
import com.cloudsec.monitor.incident.dto.CreateIncidentRequest;
import com.cloudsec.monitor.incident.dto.IncidentResponse;
import com.cloudsec.monitor.simulation.dto.SimHistoricalIncidentDto;
import com.cloudsec.monitor.simulation.dto.SimIncidentRequest;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SimulationServiceTest {

    @Mock
    private IncidentService incidentService;

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private IncidentEventRepository incidentEventRepository;

    @Mock
    private UserRepository userRepository;

    private SimulationService simulationService;

    @BeforeEach
    void setUp() {
        simulationService = new SimulationService(
                incidentService,
                incidentRepository,
                incidentEventRepository,
                userRepository
        );
    }

    @Test
    @DisplayName("Create simulated incident routes via incidentService and saves asset & risk telemetry")
    void testCreateSimulatedIncident() {
        SimIncidentRequest req = new SimIncidentRequest(
                "DDoS Burst", "Traffic spike on port 443",
                IncidentPriority.P1, "NETWORK_INTRUSION",
                "lb-01.us-east.corp", 92, null
        );

        UUID incId = UUID.randomUUID();
        IncidentResponse mockCreated = new IncidentResponse();
        mockCreated.setId(incId);
        mockCreated.setCode("INC-2026-0001");
        mockCreated.setTitle("DDoS Burst");

        when(incidentService.createIncident(any(CreateIncidentRequest.class), isNull())).thenReturn(mockCreated);

        Incident entity = new Incident();
        entity.setId(incId);
        entity.setCode("INC-2026-0001");
        entity.setTitle("DDoS Burst");
        entity.setStatus(IncidentStatus.OPEN);
        entity.setSlaDueAt(Instant.now().plus(java.time.Duration.ofHours(1)));

        when(incidentRepository.findById(incId)).thenReturn(Optional.of(entity));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(inv -> inv.getArgument(0));

        IncidentResponse result = simulationService.createSimulatedIncident(req);

        assertNotNull(result);
        assertEquals("INC-2026-0001", result.getCode());
        assertEquals("lb-01.us-east.corp", entity.getAssetId());
        assertEquals(92, entity.getRiskScore());
        verify(incidentRepository).save(entity);
    }

    @Test
    @DisplayName("Seed historical incidents inserts records and logs audit events")
    void testSeedHistoricalIncidents() {
        User analyst = new User("alice@cloudsec.local", "hash", "Alice Analyst", Role.ANALYST);
        when(userRepository.findByRole(Role.ANALYST)).thenReturn(List.of(analyst));

        SimHistoricalIncidentDto dto = new SimHistoricalIncidentDto();
        dto.setCode("INC-2026-HIST-01");
        dto.setTitle("Historical credential dump");
        dto.setDescription("Cleaned breach incident");
        dto.setPriority(IncidentPriority.P2);
        dto.setCategory("AUTH_ATTACK");
        dto.setCreatedAt(Instant.now());

        when(incidentRepository.existsByCode("INC-2026-HIST-01")).thenReturn(false);
        when(incidentRepository.save(any(Incident.class))).thenAnswer(inv -> inv.getArgument(0));

        int count = simulationService.seedHistoricalIncidents(List.of(dto));

        assertEquals(1, count);
        verify(incidentRepository).save(any(Incident.class));
        verify(incidentEventRepository, atLeastOnce()).save(any());
    }

    @Test
    @DisplayName("Reset demo state purges existing records and seeds 2 fresh incidents")
    void testResetDemoState() {
        IncidentResponse res1 = new IncidentResponse();
        res1.setId(UUID.randomUUID());
        IncidentResponse res2 = new IncidentResponse();
        res2.setId(UUID.randomUUID());

        when(incidentService.createIncident(any(CreateIncidentRequest.class), isNull()))
                .thenReturn(res1)
                .thenReturn(res2);

        simulationService.resetDemoState();

        verify(incidentEventRepository).deleteAll();
        verify(incidentRepository).deleteAll();
        verify(incidentService, times(2)).createIncident(any(), isNull());
    }
}
