package com.cloudsec.monitor.simulation;

import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.incident.IncidentPriority;
import com.cloudsec.monitor.incident.dto.IncidentResponse;
import com.cloudsec.monitor.simulation.dto.SimIncidentRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Collections;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SimulationControllerTest {

    @Mock
    private SimulationService simulationService;

    private SimulationController controller;

    @BeforeEach
    void setUp() {
        controller = new SimulationController(simulationService, "cloudsec-sim-key");
    }

    @Test
    @DisplayName("Reject request when X-Sim-Key is missing or wrong")
    void testRejectsUnauthorizedSimKey() {
        SimIncidentRequest req = new SimIncidentRequest();

        ApiException ex1 = assertThrows(ApiException.class, () ->
                controller.ingestIncident(null, req)
        );
        assertEquals(ErrorCode.UNAUTHENTICATED, ex1.getErrorCode());

        ApiException ex2 = assertThrows(ApiException.class, () ->
                controller.ingestIncident("wrong-key", req)
        );
        assertEquals(ErrorCode.UNAUTHENTICATED, ex2.getErrorCode());
    }

    @Test
    @DisplayName("Accept valid X-Sim-Key and delegate to simulation service")
    void testAcceptsValidSimKey() {
        SimIncidentRequest req = new SimIncidentRequest(
                "Burst", "Description", IncidentPriority.P1, "AUTH_ATTACK", null, null, null
        );
        IncidentResponse mockResponse = new IncidentResponse();
        when(simulationService.createSimulatedIncident(req)).thenReturn(mockResponse);

        ResponseEntity<IncidentResponse> res = controller.ingestIncident("cloudsec-sim-key", req);
        assertEquals(HttpStatus.CREATED, res.getStatusCode());
        assertNotNull(res.getBody());

        // Test demo reset
        ResponseEntity<Map<String, String>> resetRes = controller.resetDemo("cloudsec-sim-key");
        assertEquals(HttpStatus.OK, resetRes.getStatusCode());
        verify(simulationService).resetDemoState();
    }
}
