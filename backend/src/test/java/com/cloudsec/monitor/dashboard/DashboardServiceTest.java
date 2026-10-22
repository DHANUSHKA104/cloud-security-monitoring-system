package com.cloudsec.monitor.dashboard;

import com.cloudsec.monitor.dashboard.dto.AnalystWorkloadResponse;
import com.cloudsec.monitor.dashboard.dto.DashboardInsightsResponse;
import com.cloudsec.monitor.dashboard.dto.DashboardSummaryResponse;
import com.cloudsec.monitor.dashboard.dto.DashboardTrendsResponse;
import com.cloudsec.monitor.incident.Incident;
import com.cloudsec.monitor.incident.IncidentEventRepository;
import com.cloudsec.monitor.incident.IncidentPriority;
import com.cloudsec.monitor.incident.IncidentRepository;
import com.cloudsec.monitor.incident.IncidentStatus;
import com.cloudsec.monitor.shift.ShiftRepository;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private IncidentEventRepository incidentEventRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ShiftRepository shiftRepository;

    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        dashboardService = new DashboardService(
                incidentRepository,
                incidentEventRepository,
                userRepository,
                shiftRepository,
                "http://localhost:8000"
        );
    }

    @Test
    @DisplayName("Dashboard summary correctly calculates threat score, threat level, MTTR, and SLA compliance")
    void testSummaryCalculations() {
        // Given
        when(incidentRepository.countByStatusNotIn(anyCollection())).thenReturn(3L);
        when(incidentRepository.countByPriorityAndStatusNotIn(eq(IncidentPriority.P1), anyCollection())).thenReturn(1L);

        Instant now = Instant.now();
        Incident incP1 = new Incident();
        incP1.setPriority(IncidentPriority.P1);
        incP1.setStatus(IncidentStatus.OPEN);
        incP1.setCreatedAt(now.minus(Duration.ofMinutes(10)));
        incP1.setSlaDueAt(now.plus(Duration.ofMinutes(20))); // Remaining 20 min -> At Risk

        Incident incP2 = new Incident();
        incP2.setPriority(IncidentPriority.P2);
        incP2.setStatus(IncidentStatus.TRIAGED);
        incP2.setCreatedAt(now.minus(Duration.ofMinutes(30)));
        incP2.setSlaDueAt(now.plus(Duration.ofMinutes(90))); // On track

        Incident incP3 = new Incident();
        incP3.setPriority(IncidentPriority.P3);
        incP3.setStatus(IncidentStatus.IN_PROGRESS);
        incP3.setCreatedAt(now.minus(Duration.ofMinutes(50)));
        incP3.setSlaDueAt(now.minus(Duration.ofMinutes(5))); // Breached

        when(incidentRepository.findByStatusNotIn(anyCollection())).thenReturn(List.of(incP1, incP2, incP3));

        // Resolved incidents
        Incident resolved1 = new Incident();
        resolved1.setStatus(IncidentStatus.RESOLVED);
        resolved1.setCreatedAt(now.minus(Duration.ofMinutes(60)));
        resolved1.setResolvedAt(now.minus(Duration.ofMinutes(40))); // 20m MTTR
        resolved1.setSlaDueAt(now.minus(Duration.ofMinutes(30))); // In SLA

        Incident resolved2 = new Incident();
        resolved2.setStatus(IncidentStatus.CLOSED);
        resolved2.setCreatedAt(now.minus(Duration.ofMinutes(100)));
        resolved2.setResolvedAt(now.minus(Duration.ofMinutes(20))); // 80m MTTR
        resolved2.setSlaDueAt(now.minus(Duration.ofMinutes(50))); // Late (Breached)

        when(incidentRepository.findByStatusIn(anyCollection())).thenReturn(List.of(resolved1, resolved2));

        // When
        DashboardSummaryResponse summary = dashboardService.getSummary();

        // Then
        assertEquals(3, summary.getOpenIncidents());
        assertEquals(1, summary.getP1Open());
        // Threat score: P1 (40) + P2 (20) + P3 (8) = 68.0
        assertEquals(68.0, summary.getThreatScore());
        assertEquals("CRITICAL", summary.getThreatLevel());
        // SLA compliance: 1 of 2 in SLA = 50.0%
        assertEquals(50.0, summary.getSlaCompliancePct());
        // MTTR: (20 + 80) / 2 = 50.0 minutes
        assertEquals(50.0, summary.getMttrMinutes());
        // At risk (incP1 has 20m <= 30m) = 1, Breached (incP3 is past SLA due) = 1
        assertEquals(1, summary.getAtRiskCount());
        assertEquals(1, summary.getBreachedCount());
    }

    @Test
    @DisplayName("Dashboard trends returns 14 daily and 24 hourly buckets with priority counts")
    void testTrends() {
        when(incidentRepository.findByCreatedAtAfter(any(Instant.class))).thenReturn(Collections.emptyList());

        Incident incP1 = new Incident();
        incP1.setPriority(IncidentPriority.P1);
        incP1.setStatus(IncidentStatus.OPEN);

        Incident incP4 = new Incident();
        incP4.setPriority(IncidentPriority.P4);
        incP4.setStatus(IncidentStatus.IN_PROGRESS);

        when(incidentRepository.findByStatusNotIn(anyCollection())).thenReturn(List.of(incP1, incP4));

        DashboardTrendsResponse trends = dashboardService.getTrends();

        assertNotNull(trends);
        assertEquals(14, trends.getDaily().size());
        assertEquals(24, trends.getHourly().size());
        assertEquals(1, trends.getByPriority().getP1());
        assertEquals(0, trends.getByPriority().getP2());
        assertEquals(0, trends.getByPriority().getP3());
        assertEquals(1, trends.getByPriority().getP4());
    }

    @Test
    @DisplayName("Analyst workload accurately computes weighted load and sorts highest first")
    void testAnalystWorkload() {
        User alice = new User("alice@cloudsec.local", "hashed", "Alice Analyst", Role.ANALYST);
        alice.setId(UUID.randomUUID());

        User bob = new User("bob@cloudsec.local", "hashed", "Bob Analyst", Role.ANALYST);
        bob.setId(UUID.randomUUID());

        when(userRepository.findByRole(Role.ANALYST)).thenReturn(List.of(alice, bob));

        Incident inc1 = new Incident();
        inc1.setAssignee(alice);
        inc1.setPriority(IncidentPriority.P1);

        Incident inc2 = new Incident();
        inc2.setAssignee(alice);
        inc2.setPriority(IncidentPriority.P2);

        Incident inc3 = new Incident();
        inc3.setAssignee(bob);
        inc3.setPriority(IncidentPriority.P4);

        when(incidentRepository.findByStatusNotIn(anyCollection())).thenReturn(List.of(inc1, inc2, inc3));

        List<AnalystWorkloadResponse> workload = dashboardService.getWorkload();

        assertEquals(2, workload.size());
        // Alice has P1 (4.0) + P2 (2.0) = 6.0
        assertEquals(alice.getId(), workload.get(0).getUserId());
        assertEquals("Alice Analyst", workload.get(0).getFullName());
        assertEquals(6.0, workload.get(0).getWeightedLoad());
        assertEquals(2, workload.get(0).getOpenCount());

        // Bob has P4 (0.5) = 0.5
        assertEquals(bob.getId(), workload.get(1).getUserId());
        assertEquals("Bob Analyst", workload.get(1).getFullName());
        assertEquals(0.5, workload.get(1).getWeightedLoad());
        assertEquals(1, workload.get(1).getOpenCount());
    }

    @Test
    @DisplayName("Dashboard insights generates statistical fallback metrics safely")
    void testInsightsFallback() {
        when(incidentRepository.findByCreatedAtAfter(any(Instant.class))).thenReturn(Collections.emptyList());
        when(shiftRepository.findShiftsBetween(any(Instant.class), any(Instant.class))).thenReturn(Collections.emptyList());
        when(incidentRepository.findByStatusIn(anyCollection())).thenReturn(Collections.emptyList());

        DashboardInsightsResponse insights = dashboardService.getInsights();

        assertNotNull(insights);
        assertTrue(insights.isAvailable());
        assertNotNull(insights.getVolumeAnomalies());
        assertNotNull(insights.getCoverageGaps());
        assertNotNull(insights.getResolutionStats());
    }
}
