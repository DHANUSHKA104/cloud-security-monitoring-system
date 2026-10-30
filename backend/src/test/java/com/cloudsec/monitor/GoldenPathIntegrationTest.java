package com.cloudsec.monitor;

import com.cloudsec.monitor.auth.dto.LoginRequest;
import com.cloudsec.monitor.auth.dto.LoginResponse;
import com.cloudsec.monitor.incident.IncidentPriority;
import com.cloudsec.monitor.incident.IncidentStatus;
import com.cloudsec.monitor.incident.dto.CreateIncidentRequest;
import com.cloudsec.monitor.incident.dto.IncidentResponse;
import com.cloudsec.monitor.incident.dto.ReopenRequest;
import com.cloudsec.monitor.incident.dto.UpdateStatusRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers(disabledWithoutDocker = true)
class GoldenPathIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("cloudsec_test")
            .withUsername("cloudsec")
            .withPassword("testpass");

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    @DisplayName("Golden Path: Full Incident Lifecycle from Creation to Resolution and Reopen")
    void testGoldenPathIncidentLifecycle() {
        // 1. Authenticate as Admin
        LoginRequest loginReq = new LoginRequest("admin@cloudsec.local", "Admin@CloudSec2026!");
        ResponseEntity<LoginResponse> loginRes = restTemplate.postForEntity("/api/auth/login", loginReq, LoginResponse.class);
        assertEquals(HttpStatus.OK, loginRes.getStatusCode());
        assertNotNull(loginRes.getBody());
        String token = loginRes.getBody().getAccessToken();
        assertNotNull(token);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 2. Create Incident
        CreateIncidentRequest createReq = new CreateIncidentRequest();
        createReq.setTitle("Golden Path Critical Security Alert");
        createReq.setDescription("Integration test verifying end-to-end incident flow with smart routing");
        createReq.setPriority(IncidentPriority.P1);
        createReq.setCategory("AUTH_ATTACK");

        HttpEntity<CreateIncidentRequest> createEntity = new HttpEntity<>(createReq, headers);
        ResponseEntity<IncidentResponse> createRes = restTemplate.postForEntity("/api/incidents", createEntity, IncidentResponse.class);
        assertEquals(HttpStatus.CREATED, createRes.getStatusCode());
        assertNotNull(createRes.getBody());
        IncidentResponse created = createRes.getBody();
        assertNotNull(created.getId());
        assertTrue(created.getCode().startsWith("INC-"));

        // 3. Triage Incident (OPEN -> TRIAGED)
        UpdateStatusRequest triageReq = new UpdateStatusRequest(IncidentStatus.TRIAGED, "Triaging ticket");
        HttpEntity<UpdateStatusRequest> triageEntity = new HttpEntity<>(triageReq, headers);
        ResponseEntity<IncidentResponse> triageRes = restTemplate.exchange(
                "/api/incidents/" + created.getId() + "/status",
                HttpMethod.PATCH,
                triageEntity,
                IncidentResponse.class
        );
        assertEquals(HttpStatus.OK, triageRes.getStatusCode());
        assertEquals(IncidentStatus.TRIAGED, triageRes.getBody().getStatus());

        // 4. Move to Active Containment (TRIAGED -> IN_PROGRESS)
        UpdateStatusRequest progressReq = new UpdateStatusRequest(IncidentStatus.IN_PROGRESS, "Containing blast radius");
        HttpEntity<UpdateStatusRequest> progressEntity = new HttpEntity<>(progressReq, headers);
        ResponseEntity<IncidentResponse> progressRes = restTemplate.exchange(
                "/api/incidents/" + created.getId() + "/status",
                HttpMethod.PATCH,
                progressEntity,
                IncidentResponse.class
        );
        assertEquals(HttpStatus.OK, progressRes.getStatusCode());
        assertEquals(IncidentStatus.IN_PROGRESS, progressRes.getBody().getStatus());

        // 5. Resolve Incident (IN_PROGRESS -> RESOLVED)
        UpdateStatusRequest resolveReq = new UpdateStatusRequest(IncidentStatus.RESOLVED, "Root cause mitigated and patched");
        HttpEntity<UpdateStatusRequest> resolveEntity = new HttpEntity<>(resolveReq, headers);
        ResponseEntity<IncidentResponse> resolveRes = restTemplate.exchange(
                "/api/incidents/" + created.getId() + "/status",
                HttpMethod.PATCH,
                resolveEntity,
                IncidentResponse.class
        );
        assertEquals(HttpStatus.OK, resolveRes.getStatusCode());
        assertEquals(IncidentStatus.RESOLVED, resolveRes.getBody().getStatus());
        assertNotNull(resolveRes.getBody().getResolvedAt());

        // 6. Reopen Incident via /reopen endpoint
        ReopenRequest reopenReq = new ReopenRequest("Post-incident verification failed");
        HttpEntity<ReopenRequest> reopenEntity = new HttpEntity<>(reopenReq, headers);
        ResponseEntity<IncidentResponse> reopenRes = restTemplate.postForEntity(
                "/api/incidents/" + created.getId() + "/reopen",
                reopenEntity,
                IncidentResponse.class
        );
        assertEquals(HttpStatus.OK, reopenRes.getStatusCode());
        assertEquals(IncidentStatus.IN_PROGRESS, reopenRes.getBody().getStatus());
        assertNull(reopenRes.getBody().getResolvedAt());
    }
}
