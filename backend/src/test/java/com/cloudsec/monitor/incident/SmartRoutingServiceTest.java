package com.cloudsec.monitor.incident;

import com.cloudsec.monitor.shift.Shift;
import com.cloudsec.monitor.shift.ShiftRepository;
import com.cloudsec.monitor.team.Skill;
import com.cloudsec.monitor.team.UserSkill;
import com.cloudsec.monitor.team.UserSkillRepository;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
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
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SmartRoutingServiceTest {

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private UserSkillRepository userSkillRepository;

    @Mock
    private IncidentRepository incidentRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private SmartRoutingService smartRoutingService;

    private User alice;
    private User bob;
    private Shift aliceShift;
    private Shift bobShift;

    @BeforeEach
    void setUp() {
        alice = new User("alice@cloudsec.local", "hash", "Alice Analyst", "SOC", Role.ANALYST);
        alice.setId(UUID.randomUUID());

        bob = new User("bob@cloudsec.local", "hash", "Bob Specialist", "SOC", Role.ANALYST);
        bob.setId(UUID.randomUUID());

        Instant now = Instant.now();
        aliceShift = new Shift(alice, now.minus(1, ChronoUnit.HOURS), now.plus(7, ChronoUnit.HOURS), null);
        bobShift = new Shift(bob, now.minus(1, ChronoUnit.HOURS), now.plus(3, ChronoUnit.HOURS), null);
    }

    @Test
    void routeIncident_WhenNoAnalystOnShift_ReturnsNoCoverage() {
        when(shiftRepository.findActiveShiftsOnNow(any(Instant.class))).thenReturn(Collections.emptyList());

        SmartRoutingService.RoutingResult result = smartRoutingService.routeIncident("AWS_SECURITY", null);

        assertTrue(result.noCoverage());
        assertNull(result.winner());
        assertTrue(result.explanationJson().contains("\"noCoverage\":true"));
    }

    @Test
    void routeIncident_WhenMultipleOnShift_SelectsHighestScoringAnalyst() {
        when(shiftRepository.findActiveShiftsOnNow(any(Instant.class))).thenReturn(List.of(aliceShift, bobShift));

        // Alice has AWS Security L3 (40 pts)
        Skill awsSkill = new Skill("AWS Security");
        when(userSkillRepository.findByUserId(alice.getId())).thenReturn(List.of(new UserSkill(alice, awsSkill, 3)));

        // Bob has no matching skill (5 pts)
        when(userSkillRepository.findByUserId(bob.getId())).thenReturn(Collections.emptyList());

        // Alice has 0 open incidents (30 pts)
        when(incidentRepository.countOpenIncidentsForUser(alice.getId())).thenReturn(0L);
        // Bob has 2 open incidents (15 pts)
        when(incidentRepository.countOpenIncidentsForUser(bob.getId())).thenReturn(2L);

        // Historical resolutions
        when(incidentRepository.countResolvedInCategoryForUser(alice.getId(), "AWS_SECURITY")).thenReturn(3L); // 10 pts
        when(incidentRepository.countResolvedInCategoryForUser(bob.getId(), "AWS_SECURITY")).thenReturn(0L); // 0 pts

        SmartRoutingService.RoutingResult result = smartRoutingService.routeIncident("AWS_SECURITY", null);

        assertFalse(result.noCoverage());
        assertNotNull(result.winner());
        assertEquals(alice.getId(), result.winner().getId());
        assertTrue(result.explanationJson().contains(alice.getFullName()));
        assertTrue(result.explanationJson().contains("\"total\":95")); // 40 + 30 + 10 + 15 = 95
    }
}
