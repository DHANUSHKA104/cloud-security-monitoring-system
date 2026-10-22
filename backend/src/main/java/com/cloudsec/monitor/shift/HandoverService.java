package com.cloudsec.monitor.shift;

import com.cloudsec.monitor.shift.dto.HandoverResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class HandoverService {

    private final JdbcTemplate jdbcTemplate;

    public HandoverService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
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

        // Templated summary string
        String templated = String.format(
                "Shift Handover Brief: %d open incidents (%d P1, %d P2, %d P3, %d P4). " +
                        "%d incident(s) at immediate risk of SLA breach. %d resolved in the past 8 hours.",
                response.getOpenCount(),
                response.getP1Count(),
                response.getP2Count(),
                response.getP3Count(),
                response.getP4Count(),
                response.getAtRiskCount(),
                response.getResolvedLast8Hours()
        );
        response.setTemplatedText(templated);

        return response;
    }
}
