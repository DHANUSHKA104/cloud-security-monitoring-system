package com.cloudsec.monitor.shift;

import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.security.UserPrincipal;
import com.cloudsec.monitor.shift.dto.ShiftHandoverRequest;
import com.cloudsec.monitor.shift.dto.ShiftHandoverResponse;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HandoverServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private ShiftRepository shiftRepository;

    @InjectMocks
    private HandoverService handoverService;

    private User sampleAnalyst;
    private Shift sampleShift;
    private UUID shiftId;
    private UUID analystId;

    @BeforeEach
    void setUp() {
        shiftId = UUID.randomUUID();
        analystId = UUID.randomUUID();
        sampleAnalyst = new User("analyst@cloudsec.local", "hash", "Bob Analyst", "SOC", Role.ANALYST);
        sampleAnalyst.setId(analystId);

        sampleShift = new Shift(sampleAnalyst, Instant.now().minusSeconds(3600), Instant.now().plusSeconds(3600), UUID.randomUUID());
        sampleShift.setId(shiftId);
    }

    @Test
    void processShiftHandover_WhenShiftNotFound_ThrowsNotFound404() {
        when(shiftRepository.findById(shiftId)).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () ->
                handoverService.processShiftHandover(shiftId, null, new ShiftHandoverRequest("Done", null)));
        assertEquals(ErrorCode.NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void processShiftHandover_WhenUnauthorizedUser_ThrowsForbidden403() {
        when(shiftRepository.findById(shiftId)).thenReturn(Optional.of(sampleShift));

        User otherUser = new User("other@cloudsec.local", "hash", "Other User", "SOC", Role.ANALYST);
        otherUser.setId(UUID.randomUUID());
        UserPrincipal otherAnalyst = UserPrincipal.create(otherUser);

        ApiException ex = assertThrows(ApiException.class, () ->
                handoverService.processShiftHandover(shiftId, otherAnalyst, new ShiftHandoverRequest("Done", null)));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    void processShiftHandover_WhenShiftOwner_CalculatesAndReturnsResponse() {
        when(shiftRepository.findById(shiftId)).thenReturn(Optional.of(sampleShift));
        UserPrincipal ownerPrincipal = UserPrincipal.create(sampleAnalyst);

        when(jdbcTemplate.queryForObject(contains("i.status = 'RESOLVED'"), eq(Integer.class), eq(analystId), any(Timestamp.class)))
                .thenReturn(3);
        when(jdbcTemplate.queryForObject(contains("i.sla_due_at <="), eq(Integer.class), eq(analystId), any(Timestamp.class)))
                .thenReturn(1);

        ShiftHandoverResponse response = handoverService.processShiftHandover(
                shiftId, ownerPrincipal, new ShiftHandoverRequest("Routine handover completed", null)
        );

        assertNotNull(response);
        assertEquals(shiftId, response.getShiftId());
        assertEquals(analystId, response.getAnalystId());
        assertEquals("Bob Analyst", response.getAnalystName());
        assertEquals("Routine handover completed", response.getNotes());
        assertEquals(3, response.getResolvedLast8Hours());
        assertEquals(1, response.getAtRiskCount());
        assertNotNull(response.getSummary());
    }

    @Test
    void processShiftHandover_WhenAdmin_SucceedsEvenIfNotOwner() {
        when(shiftRepository.findById(shiftId)).thenReturn(Optional.of(sampleShift));

        User adminUser = new User("admin@cloudsec.local", "hash", "Admin Officer", "SOC", Role.ADMIN);
        adminUser.setId(UUID.randomUUID());
        UserPrincipal adminPrincipal = UserPrincipal.create(adminUser);

        when(jdbcTemplate.queryForObject(contains("i.status = 'RESOLVED'"), eq(Integer.class), eq(analystId), any(Timestamp.class)))
                .thenReturn(0);
        when(jdbcTemplate.queryForObject(contains("i.sla_due_at <="), eq(Integer.class), eq(analystId), any(Timestamp.class)))
                .thenReturn(0);

        ShiftHandoverResponse response = handoverService.processShiftHandover(
                shiftId, adminPrincipal, new ShiftHandoverRequest("Supervisor handover override", null)
        );

        assertNotNull(response);
        assertEquals("Supervisor handover override", response.getNotes());
    }
}
