package com.cloudsec.monitor.incident;

import com.cloudsec.monitor.shift.Shift;
import com.cloudsec.monitor.shift.ShiftRepository;
import com.cloudsec.monitor.team.Skill;
import com.cloudsec.monitor.team.TeamMember;
import com.cloudsec.monitor.team.TeamMemberRepository;
import com.cloudsec.monitor.team.UserSkill;
import com.cloudsec.monitor.team.UserSkillRepository;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SmartRoutingService {

    public static final Map<String, String> CATEGORY_SKILL_MAP = Map.of(
            "AUTH_ATTACK", "auth-forensics",
            "MALWARE", "malware-analysis",
            "DATA_EXPOSURE", "data-protection",
            "NETWORK_INTRUSION", "network-forensics",
            "POLICY_VIOLATION", "compliance",
            "CLOUD_MISCONFIG", "cloud-iam"
    );

    private final ShiftRepository shiftRepository;
    private final UserSkillRepository userSkillRepository;
    private final IncidentRepository incidentRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public SmartRoutingService(
            ShiftRepository shiftRepository,
            UserSkillRepository userSkillRepository,
            IncidentRepository incidentRepository,
            TeamMemberRepository teamMemberRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper
    ) {
        this.shiftRepository = shiftRepository;
        this.userSkillRepository = userSkillRepository;
        this.incidentRepository = incidentRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    // Overload for backwards compatibility
    @Transactional(readOnly = true)
    public RoutingResult routeIncident(String category, UUID teamId) {
        return routeIncident(category, IncidentPriority.P2, 60, teamId);
    }

    @Transactional(readOnly = true)
    public RoutingResult routeIncident(String category, IncidentPriority priority, Integer slaMinutes, UUID teamId) {
        Instant now = Instant.now();
        List<Shift> activeShifts;

        if (teamId != null) {
            // Strictly check on-shift analysts for this team - DO NOT fall back to other teams silently
            activeShifts = shiftRepository.findActiveTeamShiftsOnNow(teamId, now);
            if (activeShifts.isEmpty()) {
                // No coverage: assign to team lead (else Admin) with noCoverage=true
                User fallbackAssignee = getTeamLeadOrAdmin(teamId);
                String explanationJson = buildExplanationJson(fallbackAssignee != null ? fallbackAssignee.getId() : null, true, Collections.emptyList());
                return new RoutingResult(fallbackAssignee, explanationJson, true);
            }
        } else {
            activeShifts = shiftRepository.findActiveShiftsOnNow(now);
            if (activeShifts.isEmpty()) {
                User admin = getAdminUser();
                String explanationJson = buildExplanationJson(admin != null ? admin.getId() : null, true, Collections.emptyList());
                return new RoutingResult(admin, explanationJson, true);
            }
        }

        // Deduplicate users on multiple active shifts (take shift with longest runway)
        Map<UUID, Shift> userShiftMap = new HashMap<>();
        for (Shift s : activeShifts) {
            userShiftMap.merge(s.getUser().getId(), s, (existing, replacement) ->
                    replacement.getEndsAt().isAfter(existing.getEndsAt()) ? replacement : existing);
        }

        List<CandidateScore> candidates = new ArrayList<>();
        long slaWin = (slaMinutes != null && slaMinutes > 0) ? slaMinutes : 60;

        for (Shift shift : userShiftMap.values()) {
            User user = shift.getUser();
            int skillScore = calculateSkillScore(user.getId(), category);
            double weightedLoad = calculateCandidateLoad(user.getId());
            int workloadScore = calculateWorkloadScore(weightedLoad);
            int historyScore = calculateHistoryScore(user.getId(), category, now);
            int runwayScore = calculateRunwayScore(now, shift.getEndsAt(), slaWin);
            int total = skillScore + workloadScore + historyScore + runwayScore;

            candidates.add(new CandidateScore(
                    user,
                    skillScore,
                    workloadScore,
                    historyScore,
                    runwayScore,
                    total,
                    weightedLoad
            ));
        }

        // Sort descending by total score, then tie-breaker: lower workload load
        candidates.sort(Comparator.comparingInt(CandidateScore::getTotal).reversed()
                .thenComparingDouble(CandidateScore::getWeightedLoad));

        CandidateScore winnerCandidate = candidates.get(0);
        User winner = winnerCandidate.getUser();

        String explanationJson = buildExplanationJson(winner.getId(), false, candidates);
        return new RoutingResult(winner, explanationJson, false);
    }

    private User getTeamLeadOrAdmin(UUID teamId) {
        if (teamMemberRepository != null) {
            List<TeamMember> leads = teamMemberRepository.findTeamLeads(teamId);
            if (!leads.isEmpty()) {
                return leads.get(0).getUser();
            }
        }
        return getAdminUser();
    }

    private User getAdminUser() {
        if (userRepository != null) {
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            if (!admins.isEmpty()) {
                return admins.get(0);
            }
        }
        return null;
    }

    private int calculateSkillScore(UUID userId, String category) {
        if (category == null || category.equalsIgnoreCase("OTHER")) {
            return 20; // Spec: For category OTHER everyone gets 20
        }

        String requiredSkill = CATEGORY_SKILL_MAP.get(category.toUpperCase());
        if (requiredSkill == null) {
            // Generalize match
            if (category.toLowerCase().contains("auth")) requiredSkill = "auth-forensics";
            else if (category.toLowerCase().contains("malware")) requiredSkill = "malware-analysis";
            else if (category.toLowerCase().contains("data") || category.toLowerCase().contains("exfil")) requiredSkill = "data-protection";
            else if (category.toLowerCase().contains("net")) requiredSkill = "network-forensics";
            else if (category.toLowerCase().contains("compliance") || category.toLowerCase().contains("policy")) requiredSkill = "compliance";
            else if (category.toLowerCase().contains("cloud") || category.toLowerCase().contains("aws")) requiredSkill = "cloud-iam";
            else return 20;
        }

        List<UserSkill> userSkills = userSkillRepository.findByUserId(userId);
        if (userSkills == null || userSkills.isEmpty()) {
            return 0; // Spec: missing = 0
        }

        for (UserSkill us : userSkills) {
            Skill skill = us.getSkill();
            if (skill != null && skill.getName() != null) {
                String name = skill.getName().toLowerCase().replace(" ", "-");
                if (name.equals(requiredSkill) || name.contains(requiredSkill) || requiredSkill.contains(name)) {
                    // Spec: Level 3 = 40, level 2 = 28, level 1 = 16
                    return switch (us.getLevel()) {
                        case 3 -> 40;
                        case 2 -> 28;
                        case 1 -> 16;
                        default -> 0;
                    };
                }
            }
        }

        return 0; // Missing required skill = 0
    }

    private double calculateCandidateLoad(UUID userId) {
        List<Incident> openList = incidentRepository.findOpenIncidentsForUser(userId);
        if (openList != null && !openList.isEmpty()) {
            double load = 0.0;
            for (Incident inc : openList) {
                load += switch (inc.getPriority()) {
                    case P1 -> 3.0;
                    case P2 -> 2.0;
                    case P3 -> 1.0;
                    case P4 -> 0.5;
                };
            }
            return load;
        }
        long openCount = incidentRepository.countOpenIncidentsForUser(userId);
        return (double) openCount * 2.0;
    }

    private int calculateWorkloadScore(double weightedLoad) {
        // Spec: 30 * (1 - min(load, 6) / 6)
        double score = 30.0 * (1.0 - Math.min(weightedLoad, 6.0) / 6.0);
        return (int) Math.round(Math.max(0.0, score));
    }

    private int calculateHistoryScore(UUID userId, String category, Instant now) {
        Instant cutoff30d = now.minus(30, ChronoUnit.DAYS);
        long resolvedCount = incidentRepository.countResolvedSinceByCategoryForUser(userId, category, cutoff30d);
        if (resolvedCount == 0) {
            resolvedCount = incidentRepository.countResolvedInCategoryForUser(userId, category);
        }
        // Spec: 4 points for each incident of the same category the candidate resolved in the last 30 days, maximum 20
        return (int) Math.min(resolvedCount * 4, 20);
    }

    private int calculateRunwayScore(Instant now, Instant endsAt, long slaMinutes) {
        long timeLeftMinutes = Duration.between(now, endsAt).toMinutes();
        if (timeLeftMinutes <= 0) return 0;
        // Spec: 10 if shift end is at least one SLA window away, otherwise 10 * (time left in shift / SLA window)
        if (timeLeftMinutes >= slaMinutes) {
            return 10;
        }
        return (int) Math.round(10.0 * ((double) timeLeftMinutes / slaMinutes));
    }

    private String buildExplanationJson(UUID winnerId, boolean noCoverage, List<CandidateScore> candidates) {
        try {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("winner", winnerId != null ? winnerId.toString() : null);
            map.put("noCoverage", noCoverage);

            List<Map<String, Object>> candidateMaps = candidates.stream().map(c -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("userId", c.getUser().getId().toString());
                item.put("fullName", c.getUser().getFullName());
                item.put("skill", c.getSkill());
                item.put("workload", c.getWorkload());
                item.put("history", c.getHistory());
                item.put("runway", c.getRunway());
                item.put("total", c.getTotal());
                return item;
            }).collect(Collectors.toList());

            map.put("candidates", candidateMaps);
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            return "{\"noCoverage\":" + noCoverage + "}";
        }
    }

    public record RoutingResult(User winner, String explanationJson, boolean noCoverage) {}

    public static class CandidateScore {
        private final User user;
        private final int skill;
        private final int workload;
        private final int history;
        private final int runway;
        private final int total;
        private final double weightedLoad;

        public CandidateScore(User user, int skill, int workload, int history, int runway, int total, double weightedLoad) {
            this.user = user;
            this.skill = skill;
            this.workload = workload;
            this.history = history;
            this.runway = runway;
            this.total = total;
            this.weightedLoad = weightedLoad;
        }

        public User getUser() { return user; }
        public int getSkill() { return skill; }
        public int getWorkload() { return workload; }
        public int getHistory() { return history; }
        public int getRunway() { return runway; }
        public int getTotal() { return total; }
        public double getWeightedLoad() { return weightedLoad; }
    }
}
