package com.cloudsec.monitor.incident;

import com.cloudsec.monitor.team.TeamMember;
import com.cloudsec.monitor.team.TeamMemberRepository;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Component
public class SlaEscalationScheduler {

    private static final Logger log = LoggerFactory.getLogger(SlaEscalationScheduler.class);
    private static final List<IncidentStatus> CLOSED_STATUSES = List.of(IncidentStatus.RESOLVED, IncidentStatus.CLOSED);

    private final IncidentRepository incidentRepository;
    private final IncidentEventRepository incidentEventRepository;
    private final SlaPolicyRepository slaPolicyRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;

    public SlaEscalationScheduler(
            IncidentRepository incidentRepository,
            IncidentEventRepository incidentEventRepository,
            SlaPolicyRepository slaPolicyRepository,
            UserRepository userRepository,
            TeamMemberRepository teamMemberRepository
    ) {
        this.incidentRepository = incidentRepository;
        this.incidentEventRepository = incidentEventRepository;
        this.slaPolicyRepository = slaPolicyRepository;
        this.userRepository = userRepository;
        this.teamMemberRepository = teamMemberRepository;
    }

    @Scheduled(fixedDelay = 30000, initialDelay = 15000)
    @Transactional
    public void evaluateOpenIncidents() {
        List<Incident> openIncidents = incidentRepository.findByStatusNotIn(CLOSED_STATUSES);
        if (openIncidents.isEmpty()) {
            return;
        }

        Instant now = Instant.now();
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        User defaultAdmin = admins.isEmpty() ? null : admins.get(0);

        for (Incident incident : openIncidents) {
            try {
                processIncidentSla(incident, now, defaultAdmin);
            } catch (Exception e) {
                log.error("Error evaluating SLA for incident {}: {}", incident.getCode(), e.getMessage());
            }
        }
    }

    private void processIncidentSla(Incident incident, Instant now, User defaultAdmin) {
        // SLA Policy lookup
        Optional<SlaPolicy> policyOpt = slaPolicyRepository.findById(incident.getPriority());
        if (policyOpt.isEmpty()) {
            return;
        }
        SlaPolicy policy = policyOpt.get();

        // 1. SLA Breach Check
        if (now.isAfter(incident.getSlaDueAt())) {
            if (!incidentEventRepository.existsByIncidentIdAndType(incident.getId(), "SLA_BREACHED")) {
                incidentEventRepository.save(new IncidentEvent(
                        incident,
                        "SLA_BREACHED",
                        null,
                        "{\"reason\": \"Incident resolution deadline has elapsed\"}"
                ));
                log.warn("Incident {} breached SLA deadline", incident.getCode());
            }
        } else {
            // SLA At-Risk Check: Spec 10.4 - use median resolution time in last 90 days (fallback 50% of SLA window)
            long remainingSeconds = Duration.between(now, incident.getSlaDueAt()).getSeconds();
            Instant cutoff90d = now.minus(90, java.time.temporal.ChronoUnit.DAYS);
            long sampleCount = incidentRepository.countResolvedSinceByCategoryAndPriority(incident.getCategory(), incident.getPriority(), cutoff90d);
            long expectedResolutionSeconds;
            if (sampleCount >= 5) {
                Double medianSec = incidentRepository.findMedianResolutionSeconds(incident.getCategory(), incident.getPriority().name(), cutoff90d);
                expectedResolutionSeconds = (medianSec != null) ? medianSec.longValue() : (long) (policy.getResolveMinutes() * 60 * 0.5);
            } else {
                expectedResolutionSeconds = (long) (policy.getResolveMinutes() * 60 * 0.5); // 50% fallback
            }

            if (remainingSeconds < expectedResolutionSeconds) {
                if (!incidentEventRepository.existsByIncidentIdAndType(incident.getId(), "SLA_AT_RISK")) {
                    incidentEventRepository.save(new IncidentEvent(
                            incident,
                            "SLA_AT_RISK",
                            null,
                            "{\"remainingSeconds\": " + remainingSeconds + ", \"expectedResolutionSeconds\": " + expectedResolutionSeconds + "}"
                    ));
                    log.info("Incident {} flagged SLA AT_RISK (remaining: {}s, expected: {}s)", incident.getCode(), remainingSeconds, expectedResolutionSeconds);
                }
            }
        }

        // 2. Escalation Tier Check
        long totalSeconds = Duration.between(incident.getCreatedAt(), incident.getSlaDueAt()).getSeconds();
        if (totalSeconds <= 0) {
            return;
        }

        long elapsedSeconds = Duration.between(incident.getCreatedAt(), now).getSeconds();
        double pctElapsed = (elapsedSeconds * 100.0) / totalSeconds;

        if (pctElapsed >= policy.getSecondEscalationPct() && incident.getEscalationLevel() < 2) {
            incident.setEscalationLevel(2);
            if (defaultAdmin != null) {
                incident.setEscalatedTo(defaultAdmin);
            }
            incidentRepository.save(incident);

            incidentEventRepository.save(new IncidentEvent(
                    incident,
                    "ESCALATED",
                    null,
                    "{\"level\": 2, \"trigger\": \"AUTO_SLA_75_PERCENT\", \"reason\": \"Critical SLA threshold reached (" + Math.round(pctElapsed) + "% elapsed)\"}"
            ));
            log.info("Incident {} auto-escalated to Level 2 (Admin)", incident.getCode());
        } else if (pctElapsed >= policy.getFirstEscalationPct() && incident.getEscalationLevel() < 1 && incident.getAcknowledgedAt() == null) {
            incident.setEscalationLevel(1);
            if (incident.getTeam() != null) {
                List<TeamMember> leads = teamMemberRepository.findTeamLeads(incident.getTeam().getId());
                if (!leads.isEmpty()) {
                    incident.setEscalatedTo(leads.get(0).getUser());
                } else if (defaultAdmin != null) {
                    incident.setEscalatedTo(defaultAdmin);
                }
            } else if (defaultAdmin != null) {
                incident.setEscalatedTo(defaultAdmin);
            }
            incidentRepository.save(incident);

            incidentEventRepository.save(new IncidentEvent(
                    incident,
                    "ESCALATED",
                    null,
                    "{\"level\": 1, \"trigger\": \"AUTO_SLA_25_PERCENT\", \"reason\": \"SLA warning threshold reached (" + Math.round(pctElapsed) + "% elapsed)\"}"
            ));
            log.info("Incident {} auto-escalated to Level 1 (Lead)", incident.getCode());
        }
    }
}

