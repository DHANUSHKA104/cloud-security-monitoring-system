package com.cloudsec.monitor.shift;

import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.security.UserPrincipal;
import com.cloudsec.monitor.shift.dto.HandoverResponse;
import com.cloudsec.monitor.shift.dto.ShiftHandoverRequest;
import com.cloudsec.monitor.shift.dto.ShiftHandoverResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class HandoverService {

    private final JdbcTemplate jdbcTemplate;
    private final ShiftRepository shiftRepository;

    public HandoverService(JdbcTemplate jdbcTemplate, ShiftRepository shiftRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.shiftRepository = shiftRepository;
    }

    public HandoverResponse generateHandover(UUID teamId) {
        HandoverResponse response = new HandoverResponse();
        Instant now = Instant.now();
        Instant eightHoursAgo = now.minus(Duration.ofHours(8));

        String teamFilter = (teamId != null) ? " AND i.team_id = ? " : "";
        List<Object> countParams = new ArrayList<>();
        if (teamId != null) {
            countParams.add(teamId);
        }

        // Count open incidents by priority
        String sqlCounts = "SELECT i.priority, COUNT(*) AS cnt " +
                "FROM incidents i " +
                "WHERE i.status NOT IN ('RESOLVED', 'CLOSED') " + teamFilter +
                "GROUP BY i.priority";

        jdbcTemplate.query(sqlCounts, rs -> {
            String priority = rs.getString("priority");
            int cnt = rs.getInt("cnt");
            switch (priority != null ? priority.toUpperCase() : "") {
                case "P1" -> response.setP1Count(cnt);
                case "P2" -> response.setP2Count(cnt);
                case "P3" -> response.setP3Count(cnt);
                case "P4" -> response.setP4Count(cnt);
            }
        }, countParams.toArray());

        int openTotal = response.getP1Count() + response.getP2Count() + response.getP3Count() + response.getP4Count();
        response.setOpenCount(openTotal);

        // Resolved in last 8 hours
        String sqlResolved = "SELECT COUNT(*) FROM incidents i " +
                "WHERE i.status = 'RESOLVED' AND i.resolved_at >= ? " + teamFilter;
        List<Object> resolvedParams = new ArrayList<>();
        resolvedParams.add(Timestamp.from(eightHoursAgo));
        if (teamId != null) {
            resolvedParams.add(teamId);
        }
        Integer resolvedCount = jdbcTemplate.queryForObject(sqlResolved, Integer.class, resolvedParams.toArray());
        response.setResolvedLast8Hours(resolvedCount != null ? resolvedCount : 0);

        // Incidents at risk (open and sla_due_at <= now + 30 mins)
        Instant thirtyMinsFromNow = now.plus(Duration.ofMinutes(30));
        String sqlAtRisk = "SELECT COUNT(*) FROM incidents i " +
                "WHERE i.status NOT IN ('RESOLVED', 'CLOSED') AND i.sla_due_at <= ? " + teamFilter;
        List<Object> atRiskParams = new ArrayList<>();
        atRiskParams.add(Timestamp.from(thirtyMinsFromNow));
        if (teamId != null) {
            atRiskParams.add(teamId);
        }
        Integer atRisk = jdbcTemplate.queryForObject(sqlAtRisk, Integer.class, atRiskParams.toArray());
        response.setAtRiskCount(atRisk != null ? atRisk : 0);

        // Urgent incidents list (P1, P2 or sla_due_at <= thirtyMinsFromNow, limited to 10)
        String sqlUrgent = "SELECT i.code, i.title, u.full_name, i.sla_due_at " +
                "FROM incidents i " +
                "LEFT JOIN users u ON i.assignee_id = u.id " +
                "WHERE i.status NOT IN ('RESOLVED', 'CLOSED') " +
                "  AND (i.priority IN ('P1', 'P2') OR i.sla_due_at <= ?) " +
                teamFilter +
                "ORDER BY i.sla_due_at ASC LIMIT 10";
        List<Object> urgentParams = new ArrayList<>();
        urgentParams.add(Timestamp.from(thirtyMinsFromNow));
        if (teamId != null) {
            urgentParams.add(teamId);
        }

        List<HandoverResponse.UrgentIncidentSummary> urgentList = jdbcTemplate.query(
                sqlUrgent,
                (rs, rowNum) -> {
                    String code = rs.getString("code");
                    String title = rs.getString("title");
                    String assignee = rs.getString("full_name");
                    Timestamp due = rs.getTimestamp("sla_due_at");
                    long minutesToDue = due != null ? Duration.between(now, due.toInstant()).toMinutes() : 0;
                    return new HandoverResponse.UrgentIncidentSummary(code, title, assignee != null ? assignee : "Unassigned", minutesToDue);
                },
                urgentParams.toArray()
        );
        response.setUrgentIncidents(urgentList);

        // Calculate no coverage count (active shifts count right now)
        String sqlCoverage = "SELECT COUNT(*) FROM shifts s " +
                "JOIN users u ON s.user_id = u.id " +
                "WHERE u.active = true AND s.starts_at <= ? AND s.ends_at >= ?";
        Timestamp nowTs = Timestamp.from(now);
        Integer activeOps = jdbcTemplate.queryForObject(sqlCoverage, Integer.class, nowTs, nowTs);
        response.setNoCoverageCount((activeOps != null && activeOps > 0) ? 0 : openTotal);

        return response;
    }

    @Transactional(readOnly = true)
    public ShiftHandoverResponse processShiftHandover(UUID shiftId, UserPrincipal currentUser, ShiftHandoverRequest request) {
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Shift not found: " + shiftId));

        boolean isAdmin = currentUser != null && currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOwner = currentUser != null && currentUser.getId().equals(shift.getUser().getId());

        if (!isAdmin && !isOwner) {
            throw new ApiException(ErrorCode.FORBIDDEN, "Only the assigned operator or an administrator may execute handover for this shift");
        }

        UUID analystId = shift.getUser().getId();
        Instant now = Instant.now();
        Instant eightHoursAgo = now.minus(Duration.ofHours(8));

        // Always calculate pending incidents on the backend - never trust client counts!
        String sqlCounts = "SELECT i.priority, COUNT(*) AS cnt " +
                "FROM incidents i " +
                "WHERE i.status NOT IN ('RESOLVED', 'CLOSED') AND i.assignee_id = ? " +
                "GROUP BY i.priority";

        final int[] pCounts = new int[5]; // index 1..4
        jdbcTemplate.query(sqlCounts, rs -> {
            String p = rs.getString("priority");
            int c = rs.getInt("cnt");
            if ("P1".equalsIgnoreCase(p)) pCounts[1] = c;
            else if ("P2".equalsIgnoreCase(p)) pCounts[2] = c;
            else if ("P3".equalsIgnoreCase(p)) pCounts[3] = c;
            else if ("P4".equalsIgnoreCase(p)) pCounts[4] = c;
        }, analystId);

        int pendingTotal = pCounts[1] + pCounts[2] + pCounts[3] + pCounts[4];

        // Resolved in last 8 hours by this analyst
        String sqlResolved = "SELECT COUNT(*) FROM incidents i " +
                "WHERE i.status = 'RESOLVED' AND i.assignee_id = ? AND i.resolved_at >= ?";
        Integer resolved = jdbcTemplate.queryForObject(sqlResolved, Integer.class, analystId, Timestamp.from(eightHoursAgo));
        int resolvedCount = resolved != null ? resolved : 0;

        // At risk
        Instant thirtyMins = now.plus(Duration.ofMinutes(30));
        String sqlAtRisk = "SELECT COUNT(*) FROM incidents i " +
                "WHERE i.status NOT IN ('RESOLVED', 'CLOSED') AND i.assignee_id = ? AND i.sla_due_at <= ?";
        Integer atRisk = jdbcTemplate.queryForObject(sqlAtRisk, Integer.class, analystId, Timestamp.from(thirtyMins));
        int atRiskCount = atRisk != null ? atRisk : 0;

        String notes = request != null && request.getNotes() != null ? request.getNotes() : "";
        String summary = String.format("Handover executed by %s. Pending: %d (P1:%d, P2:%d, P3:%d, P4:%d). SLA At Risk: %d. Resolved (last 8h): %d.",
                shift.getUser().getFullName(), pendingTotal, pCounts[1], pCounts[2], pCounts[3], pCounts[4], atRiskCount, resolvedCount);

        return new ShiftHandoverResponse(
                shift.getId(),
                analystId,
                shift.getUser().getFullName(),
                now,
                notes,
                pendingTotal,
                pCounts[1],
                pCounts[2],
                pCounts[3],
                pCounts[4],
                atRiskCount,
                resolvedCount,
                summary
        );
    }
}
