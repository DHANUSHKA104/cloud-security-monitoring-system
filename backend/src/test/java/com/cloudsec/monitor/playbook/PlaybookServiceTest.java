package com.cloudsec.monitor.playbook;

import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.incident.Incident;
import com.cloudsec.monitor.incident.IncidentEvent;
import com.cloudsec.monitor.incident.IncidentEventRepository;
import com.cloudsec.monitor.incident.IncidentRepository;
import com.cloudsec.monitor.playbook.dto.*;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlaybookServiceTest {

    @Mock
    private PlaybookRepository playbookRepository;

    @Mock
    private PlaybookStepRepository playbookStepRepository;

    @Mock
    private IncidentPlaybookExecutionRepository executionRepository;

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private IncidentEventRepository incidentEventRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PlaybookService playbookService;

    private Playbook samplePlaybook;
    private PlaybookStep step1;
    private PlaybookStep step2;
    private Incident sampleIncident;
    private User sampleAnalyst;

    @BeforeEach
    void setUp() {
        samplePlaybook = new Playbook("PB-AUTH-01", "Auth SOP", "AUTH_ATTACK", "Description");
        samplePlaybook.setId(UUID.randomUUID());

        step1 = new PlaybookStep(samplePlaybook, 1, "Verify Source", "Check IP", "MANUAL", "LOW");
        step1.setId(UUID.randomUUID());

        step2 = new PlaybookStep(samplePlaybook, 2, "Revoke Token", "Revoke OAuth", "AUTOMATED_SIMULATED", "MEDIUM");
        step2.setId(UUID.randomUUID());

        samplePlaybook.setSteps(List.of(step1, step2));

        sampleIncident = new Incident();
        sampleIncident.setId(UUID.randomUUID());
        sampleIncident.setCode("INC-2026-0001");
        sampleIncident.setCategory("AUTH_ATTACK");

        sampleAnalyst = new User("analyst1@cloudsec.local", "hash", "Analyst One", "SecOps", Role.ANALYST);
        sampleAnalyst.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("getAllPlaybooks - Returns active playbooks with attached steps")
    void getAllPlaybooks_success() {
        when(playbookRepository.findByActiveTrue()).thenReturn(List.of(samplePlaybook));
        when(playbookStepRepository.findByPlaybookIdOrderByStepOrderAsc(samplePlaybook.getId())).thenReturn(List.of(step1, step2));

        List<PlaybookResponse> results = playbookService.getAllPlaybooks();

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getCode()).isEqualTo("PB-AUTH-01");
        assertThat(results.get(0).getSteps()).hasSize(2);
    }

    @Test
    @DisplayName("getPlaybookByCategory - Falls back to OTHER if category has no specific playbook")
    void getPlaybookByCategory_fallbackToOther() {
        Playbook otherPb = new Playbook("PB-OTHR-01", "General Triage", "OTHER", "Universal");
        otherPb.setId(UUID.randomUUID());

        when(playbookRepository.findByCategoryAndActiveTrue("UNKNOWN_CAT")).thenReturn(Optional.empty());
        when(playbookRepository.findByCategoryAndActiveTrue("OTHER")).thenReturn(Optional.of(otherPb));
        when(playbookStepRepository.findByPlaybookIdOrderByStepOrderAsc(otherPb.getId())).thenReturn(List.of());

        PlaybookResponse res = playbookService.getPlaybookByCategory("UNKNOWN_CAT");

        assertThat(res).isNotNull();
        assertThat(res.getCategory()).isEqualTo("OTHER");
    }

    @Test
    @DisplayName("getPlaybookForIncident - Returns steps and mapped execution status")
    void getPlaybookForIncident_success() {
        UUID incId = sampleIncident.getId();
        when(incidentRepository.findById(incId)).thenReturn(Optional.of(sampleIncident));
        when(playbookRepository.findByCategoryAndActiveTrue("AUTH_ATTACK")).thenReturn(Optional.of(samplePlaybook));
        when(playbookStepRepository.findByPlaybookIdOrderByStepOrderAsc(samplePlaybook.getId())).thenReturn(List.of(step1, step2));

        IncidentPlaybookExecution exec1 = new IncidentPlaybookExecution(incId, samplePlaybook.getId(), step1.getId(), sampleAnalyst, "COMPLETED", "IP verified clean");
        when(executionRepository.findByIncidentId(incId)).thenReturn(List.of(exec1));

        IncidentPlaybookStatusResponse status = playbookService.getPlaybookForIncident(incId);

        assertThat(status).isNotNull();
        assertThat(status.getTotalSteps()).isEqualTo(2);
        assertThat(status.getCompletedSteps()).isEqualTo(1);
        assertThat(status.getSteps()).hasSize(2);
        assertThat(status.getSteps().get(0).isExecuted()).isTrue();
        assertThat(status.getSteps().get(0).getStatus()).isEqualTo("COMPLETED");
        assertThat(status.getSteps().get(1).isExecuted()).isFalse();
        assertThat(status.getSteps().get(1).getStatus()).isEqualTo("PENDING");
    }

    @Test
    @DisplayName("executeStep - Successfully executes step and writes incident event")
    void executeStep_createsExecutionAndEvent() {
        UUID incId = sampleIncident.getId();
        UUID sId = step1.getId();
        UUID userId = sampleAnalyst.getId();

        ExecutePlaybookStepRequest req = new ExecutePlaybookStepRequest("COMPLETED", "Revoked session tokens");

        when(incidentRepository.findById(incId)).thenReturn(Optional.of(sampleIncident));
        when(playbookStepRepository.findById(sId)).thenReturn(Optional.of(step1));
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleAnalyst));
        when(executionRepository.findByIncidentIdAndStepId(incId, sId)).thenReturn(Optional.empty());

        when(executionRepository.save(any(IncidentPlaybookExecution.class))).thenAnswer(inv -> inv.getArgument(0));

        ExecutePlaybookStepResponse resp = playbookService.executeStep(incId, sId, req, userId);

        assertThat(resp).isNotNull();
        assertThat(resp.getStatus()).isEqualTo("COMPLETED");
        assertThat(resp.getNotes()).isEqualTo("Revoked session tokens");
        assertThat(resp.getExecutedByName()).isEqualTo("Analyst One");

        verify(incidentEventRepository).save(any(IncidentEvent.class));
    }

    @Test
    @DisplayName("executeStep - Throws NOT_FOUND when incident does not exist")
    void executeStep_incidentNotFound_throws() {
        UUID incId = UUID.randomUUID();
        UUID sId = step1.getId();
        UUID userId = sampleAnalyst.getId();
        ExecutePlaybookStepRequest req = new ExecutePlaybookStepRequest("COMPLETED", "notes");

        when(incidentRepository.findById(incId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> playbookService.executeStep(incId, sId, req, userId))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NOT_FOUND);
    }
}
