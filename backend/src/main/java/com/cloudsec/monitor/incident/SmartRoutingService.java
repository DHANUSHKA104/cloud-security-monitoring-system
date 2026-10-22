package com.cloudsec.monitor.incident;

import com.cloudsec.monitor.shift.Shift;
import com.cloudsec.monitor.shift.ShiftRepository;
import com.cloudsec.monitor.team.Skill;
import com.cloudsec.monitor.team.UserSkill;
import com.cloudsec.monitor.team.UserSkillRepository;
import com.cloudsec.monitor.user.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SmartRoutingService {

    private final ShiftRepository shiftRepository;
    private final UserSkillRepository userSkillRepository;
    private final IncidentRepository incidentRepository;
    private final ObjectMapper objectMapper;

    public SmartRoutingService(
            ShiftRepository shiftRepository,
            UserSkillRepository userSkillRepository,
            IncidentRepository incidentRepository,
            ObjectMapper objectMapper
    ) {
        this.shiftRepository = shiftRepository;
        this.userSkillRepository = userSkillRepository;
        this.incidentRepository = incidentRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public RoutingResult routeIncident(String category, UUID teamId) {
        Instant now = Instant.now();
        List<Shift> activeShifts = (teamId != null)
                ? shiftRepository.findActiveTeamShiftsOnNow(teamId, now)
                : shiftRepository.findActiveShiftsOnNow(now);

        // If team specified but no team member on shift, fallback to any active on-shift analyst
        if (activeShifts.isEmpty() && teamId != null) {
            activeShifts = shiftRepository.findActiveShiftsOnNow(now);
        }

        if (activeShifts.isEmpty()) {
            String emptyExplanation = buildExplanationJson(null, true, Collections.emptyList());
            return new RoutingResult(null, emptyExplanation, true);
        }

        // Deduplicate users on multiple active shifts (take shift with longest runway)
        Map<UUID, Shift> userShiftMap = new HashMap<>();
        for (Shift s : activeShifts) {
            userShiftMap.merge(s.getUser().getId(), s, (existing, replacement) ->
                    replacement.getEndsAt().isAfter(existing.getEndsAt()) ? replacement : existing);
        }

        List<CandidateScore> candidates = new ArrayList<>();

        for (Shift shift : userShiftMap.values()) {
            User user = shift.getUser();
            int skillScore = calculateSkillScore(user.getId(), category);
            int workloadScore = calculateWorkloadScore(user.getId());
            int historyScore = calculateHistoryScore(user.getId(), category);
            int runwayScore = calculateRunwayScore(now, shift.getEndsAt());
            int total = skillScore + workloadScore + historyScore + runwayScore;

            candidates.add(new CandidateScore(
                    user,
                    skillScore,
                    workloadScore,
                    historyScore,
                    runwayScore,
                    total
            ));
        }

        // Sort descending by total score, then by workload score
        candidates.sort(Comparator.comparingInt(CandidateScore::getTotal)
                .thenComparingInt(CandidateScore::getWorkload)
                .reversed());

        CandidateScore winnerCandidate = candidates.get(0);
        User winner = winnerCandidate.getUser();

        String explanationJson = buildExplanationJson(winner.getId(), false, candidates);
        return new RoutingResult(winner, explanationJson, false);
    }

    private int calculateSkillScore(UUID userId, String category) {
        List<UserSkill> userSkills = userSkillRepository.findByUserId(userId);
        if (userSkills.isEmpty()) {
            return 5; // Base score
        }

        int maxMatch = 0;
        String normalizedCategory = category != null ? category.toLowerCase().replace("_", " ") : "";

        for (UserSkill us : userSkills) {
            Skill skill = us.getSkill();
            String skillName = skill.getName().toLowerCase();

            boolean matches = normalizedCategory.contains(skillName) ||
                    skillName.contains(normalizedCategory) ||
                    isCategorySkillMatch(normalizedCategory, skillName);

            if (matches) {
                int score = switch (us.getLevel()) {
                    case 3 -> 40;
                    case 2 -> 25;
                    case 1 -> 15;
                    default -> 5;
                };
                if (score > maxMatch) {
                    maxMatch = score;
                }
            }
        }

        return maxMatch > 0 ? maxMatch : 5;
    }

    private boolean isCategorySkillMatch(String cat, String skill) {
        if (cat.contains("auth") && skill.contains("phishing")) return true;
        if (cat.contains("cloud") && skill.contains("aws")) return true;
        if (cat.contains("container") && skill.contains("kubernetes")) return true;
        if (cat.contains("ransomware") && skill.contains("malware")) return true;
        if (cat.contains("exfil") && skill.contains("network")) return true;
        return false;
    }

    private int calculateWorkloadScore(UUID userId) {
        long openCount = incidentRepository.countOpenIncidentsForUser(userId);
        if (openCount == 0) return 30;
        if (openCount == 1) return 22;
        if (openCount == 2) return 15;
        if (openCount == 3) return 8;
        return 0;
    }

    private int calculateHistoryScore(UUID userId, String category) {
        long resolvedCount = incidentRepository.countResolvedInCategoryForUser(userId, category);
        if (resolvedCount >= 6) return 15;
        if (resolvedCount >= 3) return 10;
        if (resolvedCount >= 1) return 5;
        return 0;
    }

    private int calculateRunwayScore(Instant now, Instant endsAt) {
        long hoursRemaining = Duration.between(now, endsAt).toHours();
        if (hoursRemaining >= 4) return 15;
        if (hoursRemaining >= 2) return 10;
        return 5;
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

        public CandidateScore(User user, int skill, int workload, int history, int runway, int total) {
            this.user = user;
            this.skill = skill;
            this.workload = workload;
            this.history = history;
            this.runway = runway;
            this.total = total;
        }

        public User getUser() { return user; }
        public int getSkill() { return skill; }
        public int getWorkload() { return workload; }
        public int getHistory() { return history; }
        public int getRunway() { return runway; }
        public int getTotal() { return total; }
    }
}
