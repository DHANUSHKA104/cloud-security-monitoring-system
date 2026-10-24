package com.cloudsec.monitor.dashboard;

import com.cloudsec.monitor.dashboard.dto.AnalystWorkloadResponse;
import com.cloudsec.monitor.dashboard.dto.DashboardEventFeedResponse;
import com.cloudsec.monitor.dashboard.dto.DashboardInsightsResponse;
import com.cloudsec.monitor.dashboard.dto.DashboardSummaryResponse;
import com.cloudsec.monitor.dashboard.dto.DashboardTrendsResponse;
import com.cloudsec.monitor.incident.Incident;
import com.cloudsec.monitor.incident.IncidentEvent;
import com.cloudsec.monitor.incident.IncidentEventRepository;
import com.cloudsec.monitor.incident.IncidentPriority;
import com.cloudsec.monitor.incident.IncidentRepository;
import com.cloudsec.monitor.incident.IncidentStatus;
import com.cloudsec.monitor.incident.dto.IncidentResponse;
import com.cloudsec.monitor.shift.Shift;
import com.cloudsec.monitor.shift.ShiftRepository;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardService.class);
    private static final List<IncidentStatus> CLOSED_STATUSES = List.of(IncidentStatus.RESOLVED, IncidentStatus.CLOSED);

    private final IncidentRepository incidentRepository;
    private final IncidentEventRepository incidentEventRepository;
    private final UserRepository userRepository;
    private final ShiftRepository shiftRepository;
    private final RestClient restClient;

    public DashboardService(
            IncidentRepository incidentRepository,
            IncidentEventRepository incidentEventRepository,
            UserRepository userRepository,
            ShiftRepository shiftRepository,
            @Value("${cloudsec.analytics.url:http://localhost:8000}") String analyticsUrl
    ) {
        this.incidentRepository = incidentRepository;
        this.incidentEventRepository = incidentEventRepository;
        this.userRepository = userRepository;
        this.shiftRepository = shiftRepository;
        this.restClient = RestClient.builder().baseUrl(analyticsUrl).build();
    }

    public DashboardSummaryResponse getSummary() {
        long openIncidents = incidentRepository.countByStatusNotIn(CLOSED_STATUSES);
        long p1Open = incidentRepository.countByPriorityAndStatusNotIn(IncidentPriority.P1, CLOSED_STATUSES);

        List<Incident> openList = incidentRepository.findByStatusNotIn(CLOSED_STATUSES);

        // Calculate threat score: P1=40, P2=20, P3=8, P4=2 (capped at 100)
        double score = 0.0;
        for (Incident inc : openList) {
            score += switch (inc.getPriority()) {
                case P1 -> 8.0;
                case P2 -> 4.0;
                case P3 -> 2.0;
                case P4 -> 1.0;
            };
        }
        double threatScore = score;

        String threatLevel;
        if (threatScore >= 50.0) {
            threatLevel = "CRITICAL";
        } else if (threatScore >= 25.0) {
            threatLevel = "HIGH";
        } else if (threatScore >= 10.0) {
            threatLevel = "ELEVATED";
        } else {
            threatLevel = "LOW";
        }

        // Calculate SLA compliance and MTTR from resolved/closed incidents
        List<Incident> closedList = incidentRepository.findByStatusIn(CLOSED_STATUSES);
        double slaCompliancePct = 100.0;
        double mttrMinutes = 0.0;

        if (!closedList.isEmpty()) {
            long inSla = closedList.stream()
                    .filter(inc -> inc.getResolvedAt() != null && !inc.getResolvedAt().isAfter(inc.getSlaDueAt()))
                    .count();
            slaCompliancePct = Math.round(((double) inSla / closedList.size() * 100.0) * 10.0) / 10.0;

            long totalMinutes = 0;
            long countWithResolvedAt = 0;
            for (Incident inc : closedList) {
                if (inc.getResolvedAt() != null) {
                    totalMinutes += Duration.between(inc.getCreatedAt(), inc.getResolvedAt()).toMinutes();
                    countWithResolvedAt++;
                }
            }
            if (countWithResolvedAt > 0) {
                mttrMinutes = Math.round(((double) totalMinutes / countWithResolvedAt) * 10.0) / 10.0;
            }
        }

        // At-risk and breached counts
        Instant now = Instant.now();
        long atRiskCount = 0;
        long breachedCount = 0;

        for (Incident inc : openList) {
            if (now.isAfter(inc.getSlaDueAt())) {
                breachedCount++;
            } else if (Duration.between(now, inc.getSlaDueAt()).getSeconds() <= 1800) {
                atRiskCount++;
            }
        }

        return new DashboardSummaryResponse(
                openIncidents,
                p1Open,
                threatScore,
                threatLevel,
                slaCompliancePct,
                mttrMinutes,
                atRiskCount,
                breachedCount
        );
    }

    public DashboardTrendsResponse getTrends() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Instant cutoff14d = today.minusDays(13).atStartOfDay(ZoneOffset.UTC).toInstant();
        List<Incident> recentIncidents = incidentRepository.findByCreatedAtAfter(cutoff14d);

        // Daily series for past 14 days
        List<DashboardTrendsResponse.TrendDataPoint> daily = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            LocalDate targetDate = today.minusDays(i);
            Instant start = targetDate.atStartOfDay(ZoneOffset.UTC).toInstant();
            Instant end = targetDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

            long count = recentIncidents.stream()
                    .filter(inc -> !inc.getCreatedAt().isBefore(start) && inc.getCreatedAt().isBefore(end))
                    .count();
            daily.add(new DashboardTrendsResponse.TrendDataPoint(targetDate.toString(), count));
        }

        // Hourly series for past 24 hours
        List<DashboardTrendsResponse.TrendDataPoint> hourly = new ArrayList<>();
        Instant nowHour = Instant.now().truncatedTo(ChronoUnit.HOURS);
        DateTimeFormatter hourFmt = DateTimeFormatter.ofPattern("HH:00").withZone(ZoneOffset.UTC);

        for (int i = 23; i >= 0; i--) {
            Instant slotStart = nowHour.minus(i, ChronoUnit.HOURS);
            Instant slotEnd = slotStart.plus(1, ChronoUnit.HOURS);

            long count = recentIncidents.stream()
                    .filter(inc -> !inc.getCreatedAt().isBefore(slotStart) && inc.getCreatedAt().isBefore(slotEnd))
                    .count();
            hourly.add(new DashboardTrendsResponse.TrendDataPoint(hourFmt.format(slotStart), count));
        }

        // Priority breakdown across open incidents
        List<Incident> openList = incidentRepository.findByStatusNotIn(CLOSED_STATUSES);
        long p1 = openList.stream().filter(i -> i.getPriority() == IncidentPriority.P1).count();
        long p2 = openList.stream().filter(i -> i.getPriority() == IncidentPriority.P2).count();
        long p3 = openList.stream().filter(i -> i.getPriority() == IncidentPriority.P3).count();
        long p4 = openList.stream().filter(i -> i.getPriority() == IncidentPriority.P4).count();

        return new DashboardTrendsResponse(
                daily,
                hourly,
                new DashboardTrendsResponse.PriorityBreakdown(p1, p2, p3, p4)
        );
    }

    public List<AnalystWorkloadResponse> getWorkload() {
        List<User> analysts = userRepository.findByRole(Role.ANALYST);
        List<Incident> openIncidents = incidentRepository.findByStatusNotIn(CLOSED_STATUSES);

        // Collect all distinct assignees among open incidents
        Map<UUID, User> userMap = new HashMap<>();
        for (User a : analysts) {
            userMap.put(a.getId(), a);
        }
        for (Incident inc : openIncidents) {
            if (inc.getAssignee() != null) {
                userMap.putIfAbsent(inc.getAssignee().getId(), inc.getAssignee());
            }
        }

        List<AnalystWorkloadResponse> workloadList = new ArrayList<>();

        for (User user : userMap.values()) {
            List<Incident> userIncidents = openIncidents.stream()
                    .filter(inc -> inc.getAssignee() != null && inc.getAssignee().getId().equals(user.getId()))
                    .toList();

            long p1 = userIncidents.stream().filter(i -> i.getPriority() == IncidentPriority.P1).count();
            long p2 = userIncidents.stream().filter(i -> i.getPriority() == IncidentPriority.P2).count();
            long p3 = userIncidents.stream().filter(i -> i.getPriority() == IncidentPriority.P3).count();
            long p4 = userIncidents.stream().filter(i -> i.getPriority() == IncidentPriority.P4).count();

            double weightedLoad = (p1 * 3.0) + (p2 * 2.0) + (p3 * 1.0) + (p4 * 0.5);

            workloadList.add(new AnalystWorkloadResponse(
                    user.getId(),
                    user.getFullName(),
                    userIncidents.size(),
                    weightedLoad,
                    new DashboardTrendsResponse.PriorityBreakdown(p1, p2, p3, p4)
            ));
        }

        // Sort descending by weighted load
        workloadList.sort(Comparator.comparingDouble(AnalystWorkloadResponse::getWeightedLoad).reversed());

        return workloadList;
    }

    public List<IncidentResponse> getAtRisk() {
        List<Incident> openSorted = incidentRepository.findOpenIncidentsOrderedByDue();
        return openSorted.stream()
                .map(IncidentResponse::from)
                .toList();
    }

    public List<DashboardEventFeedResponse> getFeed(int limit) {
        List<IncidentEvent> events = incidentEventRepository.findTop30ByOrderByCreatedAtDesc();
        int safeLimit = Math.min(Math.max(limit, 1), events.size());
        return events.subList(0, safeLimit).stream()
                .map(DashboardEventFeedResponse::from)
                .toList();
    }

    public DashboardInsightsResponse getInsights() {
        // Attempt to call Python analytics service if available
        try {
            DashboardInsightsResponse pythonInsights = restClient.get()
                    .uri("/api/insights")
                    .retrieve()
                    .body(DashboardInsightsResponse.class);

            if (pythonInsights != null && pythonInsights.isAvailable()) {
                return pythonInsights;
            }
        } catch (Exception e) {
            log.debug("Python analytics service not reachable ({}), computing fallback statistics", e.getMessage());
        }

        // Statistical fallback calculation
        return computeStatisticalInsights();
    }

    private DashboardInsightsResponse computeStatisticalInsights() {
        List<DashboardInsightsResponse.VolumeAnomaly> volumeAnomalies = new ArrayList<>();
        List<DashboardInsightsResponse.CoverageGap> coverageGaps = new ArrayList<>();
        List<DashboardInsightsResponse.ResolutionStat> resolutionStats = new ArrayList<>();

        // 1. Volume Anomalies detection across recent hourly buckets
        Instant cutoff7d = Instant.now().minus(7, ChronoUnit.DAYS);
        List<Incident> past7dIncidents = incidentRepository.findByCreatedAtAfter(cutoff7d);

        if (!past7dIncidents.isEmpty()) {
            double meanPerHour = (double) past7dIncidents.size() / (7 * 24);
            // Check past 6 hours for spikes
            Instant nowHour = Instant.now().truncatedTo(ChronoUnit.HOURS);
            for (int i = 0; i < 6; i++) {
                Instant start = nowHour.minus(i, ChronoUnit.HOURS);
                Instant end = start.plus(1, ChronoUnit.HOURS);
                long count = past7dIncidents.stream()
                        .filter(inc -> !inc.getCreatedAt().isBefore(start) && inc.getCreatedAt().isBefore(end))
                        .count();

                double stdDev = Math.max(Math.sqrt(meanPerHour), 1.0);
                double zScore = (count - meanPerHour) / stdDev;
                if (zScore >= 2.0 && count > 0) {
                    volumeAnomalies.add(new DashboardInsightsResponse.VolumeAnomaly(
                            start.toString(),
                            count,
                            Math.round(meanPerHour * 10.0) / 10.0,
                            Math.round(zScore * 10.0) / 10.0
                    ));
                }
            }
        }

        // 2. Upcoming Shift Coverage Gap detection (next 7 days)
        Instant now = Instant.now();
        Instant end7d = now.plus(7, ChronoUnit.DAYS);
        List<Shift> upcomingShifts = shiftRepository.findShiftsBetween(now, end7d);

        // Check key shift windows (00:00, 08:00, 16:00) over the next 3 days
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        int[] peakHours = new int[]{0, 8, 16};

        for (int dayOffset = 0; dayOffset < 3; dayOffset++) {
            LocalDate date = today.plusDays(dayOffset);
            DayOfWeek dow = date.getDayOfWeek();

            for (int hour : peakHours) {
                Instant slotTime = date.atTime(hour, 0).toInstant(ZoneOffset.UTC);
                long scheduledCount = upcomingShifts.stream()
                        .filter(s -> !s.getStartsAt().isAfter(slotTime) && s.getEndsAt().isAfter(slotTime))
                        .count();

                double expectedLoad = (hour == 8 || hour == 16) ? 3.0 : 1.5;
                if (scheduledCount < 1) {
                    coverageGaps.add(new DashboardInsightsResponse.CoverageGap(
                            dow.toString(),
                            hour,
                            expectedLoad,
                            (int) scheduledCount
                    ));
                }
            }
        }

        // 3. Resolution Stats by category & priority
        List<Incident> resolvedList = incidentRepository.findByStatusIn(CLOSED_STATUSES);
        Map<String, List<Long>> durationsByKey = new HashMap<>();

        for (Incident inc : resolvedList) {
            if (inc.getResolvedAt() != null) {
                long minutes = Duration.between(inc.getCreatedAt(), inc.getResolvedAt()).toMinutes();
                String key = inc.getCategory() + ":" + inc.getPriority().name();
                durationsByKey.computeIfAbsent(key, k -> new ArrayList<>()).add(minutes);
            }
        }

        for (Map.Entry<String, List<Long>> entry : durationsByKey.entrySet()) {
            String[] parts = entry.getKey().split(":");
            List<Long> durations = entry.getValue();
            durations.sort(Long::compareTo);

            int size = durations.size();
            double median = durations.get(size / 2);
            double p90 = durations.get((int) Math.min(size - 1, Math.round(size * 0.9)));

            resolutionStats.add(new DashboardInsightsResponse.ResolutionStat(
                    parts[0],
                    parts[1],
                    median,
                    p90,
                    size
            ));
        }

        return new DashboardInsightsResponse(
                true,
                volumeAnomalies,
                coverageGaps,
                resolutionStats
        );
    }
}
