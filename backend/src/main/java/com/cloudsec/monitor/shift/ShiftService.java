package com.cloudsec.monitor.shift;

import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.shift.dto.CreateShiftRequest;
import com.cloudsec.monitor.shift.dto.ShiftResponse;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ShiftService {

    private static final long MAX_SHIFT_HOURS = 16;

    private final ShiftRepository shiftRepository;
    private final UserRepository userRepository;

    public ShiftService(ShiftRepository shiftRepository, UserRepository userRepository) {
        this.shiftRepository = shiftRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ShiftResponse> getShifts(UUID userId, Instant from, Instant to) {
        org.springframework.data.jpa.domain.Specification<Shift> spec = (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("endsAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startsAt"), to));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return shiftRepository.findAll(spec, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "startsAt"))
                .stream()
                .map(ShiftResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public ShiftResponse createShift(CreateShiftRequest request, UUID adminId) {
        if (!request.getEndsAt().isAfter(request.getStartsAt())) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Shift end must be after its start");
        }

        Duration duration = Duration.between(request.getStartsAt(), request.getEndsAt());
        if (duration.toHours() > MAX_SHIFT_HOURS) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Shift duration cannot exceed 16 hours");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found"));

        // Check overlapping shifts for this user
        List<Shift> overlapping = shiftRepository.findOverlappingShifts(
                user.getId(),
                request.getStartsAt(),
                request.getEndsAt()
        );

        if (!overlapping.isEmpty()) {
            throw new ApiException(ErrorCode.CONFLICT, "This shift overlaps another one");
        }

        Shift shift = new Shift(user, request.getStartsAt(), request.getEndsAt(), adminId);
        Shift saved = shiftRepository.save(shift);
        return ShiftResponse.from(saved);
    }

    @Transactional
    public void deleteShift(UUID id) {
        shiftRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<ShiftResponse> getActiveShiftsOnNow(UUID teamId) {
        Instant now = Instant.now();
        List<Shift> shifts = teamId != null
                ? shiftRepository.findActiveTeamShiftsOnNow(teamId, now)
                : shiftRepository.findActiveShiftsOnNow(now);

        return shifts.stream()
                .map(ShiftResponse::from)
                .collect(Collectors.toList());
    }
}
