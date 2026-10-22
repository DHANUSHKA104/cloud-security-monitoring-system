package com.cloudsec.monitor.incident;

import com.cloudsec.monitor.team.TeamMemberRepository;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SlaEscalationSchedulerTest {

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private IncidentEventRepository incidentEventRepository;

    @Mock
    private SlaPolicyRepository slaPolicyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TeamMemberRepository teamMemberRepository;

    private SlaEscalationScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new SlaEscalationScheduler(
                incidentRepository,
                incidentEventRepository,
                slaPolicyRepository,
                userRepository,
                teamMemberRepository
        );
    }

    @Test
    @DisplayName("Scheduler auto-escalates to Level 1 when 25% SLA threshold is exceeded")
    void testAutoEscalateLevel1() {
        Instant now = Instant.now();
        Instant createdAt = now.minus(Duration.ofMinutes(30));
        Instant slaDueAt = now.plus(Duration.ofMinutes(70)); // Total 100m, 30m elapsed = 30% > 25%, remaining 70m > 30m

        Incident incident = new Incident();
        incident.setId(UUID.randomUUID());
        incident.setCode("INC-2026-0001");
        incident.setPriority(IncidentPriority.P1);
        incident.setStatus(IncidentStatus.OPEN);
        incident.setCreatedAt(createdAt);
        incident.setSlaDueAt(slaDueAt);
        incident.setEscalationLevel(0);

        when(incidentRepository.findByStatusNotIn(anyCollection())).thenReturn(List.of(incident));
        when(slaPolicyRepository.findById(IncidentPriority.P1))
                .thenReturn(Optional.of(new SlaPolicy(IncidentPriority.P1, 100, 25, 75)));

        scheduler.evaluateOpenIncidents();

        assertEquals(1, incident.getEscalationLevel());
        verify(incidentRepository).save(incident);
        verify(incidentEventRepository, atLeastOnce()).save(any(IncidentEvent.class));
    }

    @Test
    @DisplayName("Scheduler auto-escalates to Level 2 (Admin) when 75% SLA threshold is exceeded")
    void testAutoEscalateLevel2() {
        Instant now = Instant.now();
        Instant createdAt = now.minus(Duration.ofMinutes(80));
        Instant slaDueAt = now.plus(Duration.ofMinutes(20)); // Total 100m, 80m elapsed = 80% > 75%

        Incident incident = new Incident();
        incident.setId(UUID.randomUUID());
        incident.setCode("INC-2026-0002");
        incident.setPriority(IncidentPriority.P1);
        incident.setStatus(IncidentStatus.OPEN);
        incident.setCreatedAt(createdAt);
        incident.setSlaDueAt(slaDueAt);
        incident.setEscalationLevel(1);

        User admin = new User("admin@cloudsec.local", "hash", "Admin User", Role.ADMIN);
        when(userRepository.findByRole(Role.ADMIN)).thenReturn(List.of(admin));

        when(incidentRepository.findByStatusNotIn(anyCollection())).thenReturn(List.of(incident));
        when(slaPolicyRepository.findById(IncidentPriority.P1))
                .thenReturn(Optional.of(new SlaPolicy(IncidentPriority.P1, 100, 25, 75)));

        scheduler.evaluateOpenIncidents();

        assertEquals(2, incident.getEscalationLevel());
        assertEquals(admin, incident.getEscalatedTo());
        verify(incidentRepository).save(incident);
    }

    @Test
    @DisplayName("Scheduler logs SLA_BREACHED when incident is past due date")
    void testSlaBreachedLogging() {
        Instant now = Instant.now();
        Instant createdAt = now.minus(Duration.ofMinutes(40));
        Instant slaDueAt = now.minus(Duration.ofMinutes(10)); // Past due

        Incident incident = new Incident();
        incident.setId(UUID.randomUUID());
        incident.setCode("INC-2026-0003");
        incident.setPriority(IncidentPriority.P1);
        incident.setStatus(IncidentStatus.OPEN);
        incident.setCreatedAt(createdAt);
        incident.setSlaDueAt(slaDueAt);
        incident.setEscalationLevel(2);

        when(incidentRepository.findByStatusNotIn(anyCollection())).thenReturn(List.of(incident));
        when(incidentEventRepository.existsByIncidentIdAndType(incident.getId(), "SLA_BREACHED")).thenReturn(false);

        scheduler.evaluateOpenIncidents();

        ArgumentCaptor<IncidentEvent> eventCaptor = ArgumentCaptor.forClass(IncidentEvent.class);
        verify(incidentEventRepository).save(eventCaptor.capture());
        assertEquals("SLA_BREACHED", eventCaptor.getValue().getType());
    }
}
