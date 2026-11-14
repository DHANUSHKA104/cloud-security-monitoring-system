package com.cloudsec.monitor;

import com.cloudsec.monitor.asset.AssetStatus;
import com.cloudsec.monitor.asset.AssetType;
import com.cloudsec.monitor.asset.CloudProvider;
import com.cloudsec.monitor.asset.Criticality;
import com.cloudsec.monitor.asset.dto.AssetResponse;
import com.cloudsec.monitor.asset.dto.CreateAssetRequest;
import com.cloudsec.monitor.auth.dto.LoginRequest;
import com.cloudsec.monitor.auth.dto.LoginResponse;
import com.cloudsec.monitor.dashboard.dto.DashboardSummaryResponse;
import com.cloudsec.monitor.incident.IncidentPriority;
import com.cloudsec.monitor.incident.IncidentStatus;
import com.cloudsec.monitor.incident.dto.CreateIncidentRequest;
import com.cloudsec.monitor.incident.dto.IncidentResponse;
import com.cloudsec.monitor.incident.dto.ReopenRequest;
import com.cloudsec.monitor.incident.dto.UpdateStatusRequest;
import com.cloudsec.monitor.playbook.dto.ExecutePlaybookStepRequest;
import com.cloudsec.monitor.playbook.dto.ExecutePlaybookStepResponse;
import com.cloudsec.monitor.playbook.dto.IncidentPlaybookStatusResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.http.client.JdkClientHttpRequestFactory;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class GoldenPathIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @BeforeEach
    void setupRestTemplate() {
        restTemplate.getRestTemplate().setRequestFactory(new JdkClientHttpRequestFactory());
    }

    @Test
    @DisplayName("Golden Path: Comprehensive Milestone 1 Flow Across All 6 Modules")
    void testMilestone1GoldenPathFlow() {
        // ====================================================================
        // STEP 1 (Module 01 - Auth & RBAC): Authenticate as SOC Admin
        // ====================================================================
        LoginRequest loginReq = new LoginRequest("admin@cloudsec.local", "Admin@CloudSec2026!");
        ResponseEntity<LoginResponse> loginRes = restTemplate.postForEntity("/api/auth/login", loginReq, LoginResponse.class);
        assertEquals(HttpStatus.OK, loginRes.getStatusCode(), "Admin login must succeed");
        assertNotNull(loginRes.getBody());
        String token = loginRes.getBody().getAccessToken();
        assertNotNull(token, "Access token must be issued");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // ====================================================================
        // STEP 2 (Module 02 - User & Team Management): Query Users and Teams
        // ====================================================================
        HttpEntity<?> authEntity = new HttpEntity<>(headers);
        ResponseEntity<String> usersRes = restTemplate.exchange("/api/users", HttpMethod.GET, authEntity, String.class);
        assertEquals(HttpStatus.OK, usersRes.getStatusCode(), "Admin can list SOC operators");
        assertTrue(usersRes.getBody().contains("content"), "User pagination content returned");

        ResponseEntity<String> teamsRes = restTemplate.exchange("/api/teams", HttpMethod.GET, authEntity, String.class);
        assertEquals(HttpStatus.OK, teamsRes.getStatusCode(), "Admin can list SOC teams");

        // ====================================================================
        // STEP 3 (Module 08 - Asset Inventory): Register New Cloud Asset
        // ====================================================================
        String assetCode = "AST-TEST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        CreateAssetRequest createAssetReq = new CreateAssetRequest(
                assetCode,
                "Golden Path Microservices Cluster",
                AssetType.KUBERNETES_CLUSTER,
                CloudProvider.AWS,
                Criticality.CRITICAL,
                "10.100.4.12",
                "arn:aws:eks:us-east-1:123456789:cluster/golden-path-eks",
                AssetStatus.ACTIVE,
                "DevSecOps"
        );
        HttpEntity<CreateAssetRequest> assetEntity = new HttpEntity<>(createAssetReq, headers);
        ResponseEntity<AssetResponse> assetRes = restTemplate.postForEntity("/api/assets", assetEntity, AssetResponse.class);
        assertEquals(HttpStatus.CREATED, assetRes.getStatusCode(), "Asset creation must return 201 CREATED");
        AssetResponse createdAsset = assetRes.getBody();
        assertNotNull(createdAsset);
        assertEquals(assetCode, createdAsset.getCode());

        // Verify retrieval by code
        ResponseEntity<AssetResponse> getAssetRes = restTemplate.exchange(
                "/api/assets/code/" + assetCode,
                HttpMethod.GET,
                authEntity,
                AssetResponse.class
        );
        assertEquals(HttpStatus.OK, getAssetRes.getStatusCode());
        assertEquals(createdAsset.getId(), getAssetRes.getBody().getId());

        // ====================================================================
        // STEP 4 (Module 05 - Incident Management): Ingest Incident with Asset Link
        // ====================================================================
        CreateIncidentRequest createIncReq = new CreateIncidentRequest();
        createIncReq.setTitle("Golden Path Critical Intrusion Alert");
        createIncReq.setDescription("Automated test verifying multi-module integration and smart routing");
        createIncReq.setPriority(IncidentPriority.P1);
        createIncReq.setCategory("AUTH_ATTACK");

        HttpEntity<CreateIncidentRequest> createIncEntity = new HttpEntity<>(createIncReq, headers);
        ResponseEntity<IncidentResponse> createIncRes = restTemplate.postForEntity("/api/incidents", createIncEntity, IncidentResponse.class);
        assertEquals(HttpStatus.CREATED, createIncRes.getStatusCode());
        IncidentResponse createdIncident = createIncRes.getBody();
        assertNotNull(createdIncident);
        assertNotNull(createdIncident.getId());
        assertTrue(createdIncident.getCode().startsWith("INC-"));

        UUID incidentId = createdIncident.getId();

        // ====================================================================
        // STEP 5 (Module 10 - Response Playbooks): Retrieve Guided SOP for Incident
        // ====================================================================
        ResponseEntity<IncidentPlaybookStatusResponse> playbookRes = restTemplate.exchange(
                "/api/incidents/" + incidentId + "/playbook",
                HttpMethod.GET,
                authEntity,
                IncidentPlaybookStatusResponse.class
        );
        assertEquals(HttpStatus.OK, playbookRes.getStatusCode(), "Playbook checklist must be retrievable");
        IncidentPlaybookStatusResponse pbStatus = playbookRes.getBody();
        assertNotNull(pbStatus);
        assertEquals("AUTH_ATTACK", pbStatus.getCategory());
        assertFalse(pbStatus.getSteps().isEmpty(), "Playbook steps must be present");

        UUID firstStepId = pbStatus.getSteps().get(0).getStepId();

        // ====================================================================
        // STEP 6 (Module 10 - Playbook Automation): Execute Playbook Step
        // ====================================================================
        ExecutePlaybookStepRequest execReq = new ExecutePlaybookStepRequest("COMPLETED", "Source IP confirmed hostile; WAF deny applied");
        HttpEntity<ExecutePlaybookStepRequest> execEntity = new HttpEntity<>(execReq, headers);
        ResponseEntity<ExecutePlaybookStepResponse> execRes = restTemplate.postForEntity(
                "/api/incidents/" + incidentId + "/playbook/steps/" + firstStepId + "/execute",
                execEntity,
                ExecutePlaybookStepResponse.class
        );
        assertEquals(HttpStatus.OK, execRes.getStatusCode(), "Step execution must return 200 OK");
        assertEquals("COMPLETED", execRes.getBody().getStatus());

        // Verify updated progress
        ResponseEntity<IncidentPlaybookStatusResponse> updatedPbRes = restTemplate.exchange(
                "/api/incidents/" + incidentId + "/playbook",
                HttpMethod.GET,
                authEntity,
                IncidentPlaybookStatusResponse.class
        );
        assertEquals(1, updatedPbRes.getBody().getCompletedSteps());

        // ====================================================================
        // STEP 7 (Module 05 - Incident Management): Triage Incident (OPEN -> TRIAGED)
        // ====================================================================
        UpdateStatusRequest triageReq = new UpdateStatusRequest(IncidentStatus.TRIAGED, "Triaged and verified blast radius");
        HttpEntity<UpdateStatusRequest> triageEntity = new HttpEntity<>(triageReq, headers);
        ResponseEntity<IncidentResponse> triageRes = restTemplate.exchange(
                "/api/incidents/" + incidentId + "/status",
                HttpMethod.PATCH,
                triageEntity,
                IncidentResponse.class
        );
        assertEquals(HttpStatus.OK, triageRes.getStatusCode());
        assertEquals(IncidentStatus.TRIAGED, triageRes.getBody().getStatus());

        // ====================================================================
        // STEP 8 (Module 05 - Incident Management): Move to IN_PROGRESS
        // ====================================================================
        UpdateStatusRequest progressReq = new UpdateStatusRequest(IncidentStatus.IN_PROGRESS, "Remediation underway");
        HttpEntity<UpdateStatusRequest> progressEntity = new HttpEntity<>(progressReq, headers);
        ResponseEntity<IncidentResponse> progressRes = restTemplate.exchange(
                "/api/incidents/" + incidentId + "/status",
                HttpMethod.PATCH,
                progressEntity,
                IncidentResponse.class
        );
        assertEquals(HttpStatus.OK, progressRes.getStatusCode());
        assertEquals(IncidentStatus.IN_PROGRESS, progressRes.getBody().getStatus());

        // ====================================================================
        // STEP 9 (Module 05 - Incident Management): Resolve Incident (RESOLVED)
        // ====================================================================
        UpdateStatusRequest resolveReq = new UpdateStatusRequest(IncidentStatus.RESOLVED, "Root cause mitigated and closed");
        HttpEntity<UpdateStatusRequest> resolveEntity = new HttpEntity<>(resolveReq, headers);
        ResponseEntity<IncidentResponse> resolveRes = restTemplate.exchange(
                "/api/incidents/" + incidentId + "/status",
                HttpMethod.PATCH,
                resolveEntity,
                IncidentResponse.class
        );
        assertEquals(HttpStatus.OK, resolveRes.getStatusCode());
        assertEquals(IncidentStatus.RESOLVED, resolveRes.getBody().getStatus());
        assertNotNull(resolveRes.getBody().getResolvedAt());

        // ====================================================================
        // STEP 10 (Module 05 - Incident Management): Reopen Incident
        // ====================================================================
        ReopenRequest reopenReq = new ReopenRequest("Post-resolution verification anomaly");
        HttpEntity<ReopenRequest> reopenEntity = new HttpEntity<>(reopenReq, headers);
        ResponseEntity<IncidentResponse> reopenRes = restTemplate.postForEntity(
                "/api/incidents/" + incidentId + "/reopen",
                reopenEntity,
                IncidentResponse.class
        );
        assertEquals(HttpStatus.OK, reopenRes.getStatusCode());
        assertEquals(IncidentStatus.IN_PROGRESS, reopenRes.getBody().getStatus());

        // ====================================================================
        // STEP 11 (Module 03 - Security Dashboard): Validate Dashboard Summary KPI
        // ====================================================================
        ResponseEntity<DashboardSummaryResponse> dashRes = restTemplate.exchange(
                "/api/dashboard/summary",
                HttpMethod.GET,
                authEntity,
                DashboardSummaryResponse.class
        );
        assertEquals(HttpStatus.OK, dashRes.getStatusCode(), "Dashboard summary must succeed");
        DashboardSummaryResponse summary = dashRes.getBody();
        assertNotNull(summary);
        assertTrue(summary.getOpenIncidents() > 0, "Open incident count must reflect active incidents");
        assertTrue(summary.getTotalAssets() > 0, "Integrated asset count must be > 0");
        assertTrue(summary.getTotalPlaybooks() >= 7, "All 7 seeded playbooks must be reported");
    }
}
