package com.cloudsec.monitor.incident;

import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.incident.dto.CreateIncidentRequest;
import com.cloudsec.monitor.incident.dto.IncidentResponse;
import com.cloudsec.monitor.incident.dto.ReopenRequest;
import com.cloudsec.monitor.incident.dto.UpdateStatusRequest;
import com.cloudsec.monitor.team.TeamRepository;
import com.cloudsec.monitor.team.TeamMemberRepository;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private IncidentEventRepository incidentEventRepository;

    @Mock
    private SlaPolicyService slaPolicyService;

    @Mock
    private SmartRoutingService smartRoutingService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private TeamMemberRepository teamMemberRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private IncidentService incidentService;

    private User sampleAnalyst;
    private SlaPolicy p1Policy;

    @BeforeEach
    void setUp() {
        sampleAnalyst = new User("alice@cloudsec.local", "hash", "Alice Analyst", "SOC", Role.ANALYST);
        sampleAnalyst.setId(UUID.randomUUID());

        p1Policy = new SlaPolicy(IncidentPriority.P1, 30, 50, 75);
    }

    @Test
    void createIncident_AssignsCodeSlaAndAutoRoutes() {
        CreateIncidentRequest request = new CreateIncidentRequest();
        request.setTitle("Unauthorized root access attempt");
        request.setDescription("10 brute force tries on bastion host");
        request.setPriority(IncidentPriority.P1);
        request.setCategory("AUTH_ATTACK");

        when(incidentRepository.getNextIncidentCodeSeq()).thenReturn(42L);
        when(slaPolicyService.getPolicyOrThrow(IncidentPriority.P1)).thenReturn(p1Policy);
        when(smartRoutingService.routeIncident(eq("AUTH_ATTACK"), any())).thenReturn(
                new SmartRoutingService.RoutingResult(sampleAnalyst, "{\"winner\":\"" + sampleAnalyst.getId() + "\"}", false)
        );

        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> {
            Incident inc = invocation.getArgument(0);
            inc.setId(UUID.randomUUID());
            return inc;
        });

        IncidentResponse response = incidentService.createIncident(request, null);

        assertNotNull(response);
        assertTrue(response.getCode().startsWith("INC-"));
        assertTrue(response.getCode().endsWith("-0042"));
        assertEquals(IncidentPriority.P1, response.getPriority());
        assertEquals(IncidentStatus.OPEN, response.getStatus());
        assertNotNull(response.getAssignee());
        assertEquals(sampleAnalyst.getId(), response.getAssignee().id());

        // SLA deadline must be ~30 mins from now
        assertTrue(response.getSlaDueAt().isAfter(Instant.now().plus(28, ChronoUnit.MINUTES)));
        verify(incidentEventRepository, atLeast(1)).save(any(IncidentEvent.class));
    }

    @Test
    void updateStatus_InvalidTransition_ThrowsValidationError() {
        UUID incId = UUID.randomUUID();
        Incident incident = new Incident("INC-2026-0001", "Title", "Desc", IncidentPriority.P1,
                IncidentStatus.OPEN, "AUTH", null, null, Instant.now().plus(30, ChronoUnit.MINUTES), null, null);
        incident.setId(incId);

        when(incidentRepository.findById(incId)).thenReturn(Optional.of(incident));

        // OPEN cannot jump directly to CLOSED
        UpdateStatusRequest request = new UpdateStatusRequest(IncidentStatus.CLOSED, "closing immediately");

        ApiException ex = assertThrows(ApiException.class, () -> incidentService.updateStatus(incId, request, sampleAnalyst));
        assertEquals(ErrorCode.VALIDATION_ERROR, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Invalid status transition"));
    }

    @Test
    void updateStatus_ValidTransitionToResolved_SetsResolvedAt() {
        UUID incId = UUID.randomUUID();
        Incident incident = new Incident("INC-2026-0001", "Title", "Desc", IncidentPriority.P2,
                IncidentStatus.IN_PROGRESS, "AUTH", null, null, Instant.now().plus(120, ChronoUnit.MINUTES), null, null);
        incident.setId(incId);

        when(incidentRepository.findById(incId)).thenReturn(Optional.of(incident));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateStatusRequest request = new UpdateStatusRequest(IncidentStatus.RESOLVED, "Issue isolated");
        IncidentResponse response = incidentService.updateStatus(incId, request, sampleAnalyst);

        assertEquals(IncidentStatus.RESOLVED, response.getStatus());
        assertNotNull(response.getResolvedAt());
        verify(incidentEventRepository).save(any(IncidentEvent.class));
    }

    @Test
    void reopenIncident_WhenResolved_TransitionsToInProgress() {
        UUID incId = UUID.randomUUID();
        Incident incident = new Incident("INC-2026-0001", "Title", "Desc", IncidentPriority.P2,
                IncidentStatus.RESOLVED, "AUTH", null, null, Instant.now().plus(120, ChronoUnit.MINUTES), null, null);
        incident.setId(incId);
        incident.setResolvedAt(Instant.now());

        when(incidentRepository.findById(incId)).thenReturn(Optional.of(incident));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReopenRequest request = new ReopenRequest("New alerts detected after remediation");
        IncidentResponse response = incidentService.reopenIncident(incId, request, sampleAnalyst);

        assertEquals(IncidentStatus.IN_PROGRESS, response.getStatus());
        assertNull(response.getResolvedAt());
        verify(incidentEventRepository).save(any(IncidentEvent.class));
    }
}
