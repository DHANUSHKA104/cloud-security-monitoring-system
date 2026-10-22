package com.cloudsec.monitor.shift;

import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.shift.dto.CreateShiftRequest;
import com.cloudsec.monitor.shift.dto.ShiftResponse;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShiftServiceTest {

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ShiftService shiftService;

    private User sampleUser;
    private UUID sampleUserId;
    private UUID adminId;

    @BeforeEach
    void setUp() {
        sampleUserId = UUID.randomUUID();
        adminId = UUID.randomUUID();
        sampleUser = new User("analyst@cloudsec.local", "hash", "Alice Analyst", "SOC", Role.ANALYST);
        // reflection or setter if id is auto-generated
    }

    @Test
    void createShift_WhenValid_SavesAndReturnsShift() {
        Instant startsAt = Instant.now().plus(1, ChronoUnit.HOURS);
        Instant endsAt = startsAt.plus(8, ChronoUnit.HOURS);

        CreateShiftRequest request = new CreateShiftRequest();
        request.setUserId(sampleUserId);
        request.setStartsAt(startsAt);
        request.setEndsAt(endsAt);

        when(userRepository.findById(sampleUserId)).thenReturn(Optional.of(sampleUser));
        when(shiftRepository.findOverlappingShifts(sampleUser.getId(), startsAt, endsAt)).thenReturn(Collections.emptyList());

        Shift savedShift = new Shift(sampleUser, startsAt, endsAt, adminId);
        when(shiftRepository.save(any(Shift.class))).thenReturn(savedShift);

        ShiftResponse response = shiftService.createShift(request, adminId);

        assertNotNull(response);
        assertEquals(startsAt, response.getStartsAt());
        assertEquals(endsAt, response.getEndsAt());
        verify(shiftRepository).save(any(Shift.class));
    }

    @Test
    void createShift_WhenEndBeforeStart_ThrowsValidationError() {
        Instant startsAt = Instant.now().plus(4, ChronoUnit.HOURS);
        Instant endsAt = startsAt.minus(1, ChronoUnit.HOURS);

        CreateShiftRequest request = new CreateShiftRequest();
        request.setUserId(sampleUserId);
        request.setStartsAt(startsAt);
        request.setEndsAt(endsAt);

        ApiException ex = assertThrows(ApiException.class, () -> shiftService.createShift(request, adminId));
        assertEquals(ErrorCode.VALIDATION_ERROR, ex.getErrorCode());
        assertEquals("Shift end must be after its start", ex.getMessage());
    }

    @Test
    void createShift_WhenDurationExceeds16Hours_ThrowsValidationError() {
        Instant startsAt = Instant.now().plus(1, ChronoUnit.HOURS);
        Instant endsAt = startsAt.plus(17, ChronoUnit.HOURS);

        CreateShiftRequest request = new CreateShiftRequest();
        request.setUserId(sampleUserId);
        request.setStartsAt(startsAt);
        request.setEndsAt(endsAt);

        ApiException ex = assertThrows(ApiException.class, () -> shiftService.createShift(request, adminId));
        assertEquals(ErrorCode.VALIDATION_ERROR, ex.getErrorCode());
        assertEquals("Shift duration cannot exceed 16 hours", ex.getMessage());
    }

    @Test
    void createShift_WhenOverlapping_ThrowsConflictError() {
        Instant startsAt = Instant.now().plus(1, ChronoUnit.HOURS);
        Instant endsAt = startsAt.plus(8, ChronoUnit.HOURS);

        CreateShiftRequest request = new CreateShiftRequest();
        request.setUserId(sampleUserId);
        request.setStartsAt(startsAt);
        request.setEndsAt(endsAt);

        when(userRepository.findById(sampleUserId)).thenReturn(Optional.of(sampleUser));
        Shift existing = new Shift(sampleUser, startsAt.minus(2, ChronoUnit.HOURS), startsAt.plus(2, ChronoUnit.HOURS), adminId);
        when(shiftRepository.findOverlappingShifts(sampleUser.getId(), startsAt, endsAt)).thenReturn(List.of(existing));

        ApiException ex = assertThrows(ApiException.class, () -> shiftService.createShift(request, adminId));
        assertEquals(ErrorCode.CONFLICT, ex.getErrorCode());
        assertEquals("This shift overlaps another one", ex.getMessage());
        verify(shiftRepository, never()).save(any(Shift.class));
    }
}
