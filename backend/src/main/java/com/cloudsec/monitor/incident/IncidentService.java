package com.cloudsec.monitor.incident;

import com.cloudsec.monitor.common.dto.PageResponse;
import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.incident.dto.*;
import com.cloudsec.monitor.team.Team;
import com.cloudsec.monitor.team.TeamMember;
import com.cloudsec.monitor.team.TeamMemberRepository;
import com.cloudsec.monitor.team.TeamRepository;
import com.cloudsec.monitor.user.Role;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.Year;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final IncidentEventRepository incidentEventRepository;
    private final SlaPolicyService slaPolicyService;
    private final SmartRoutingService smartRoutingService;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ObjectMapper objectMapper;

    public IncidentService(
            IncidentRepository incidentRepository,
            IncidentEventRepository incidentEventRepository,
            SlaPolicyService slaPolicyService,
            SmartRoutingService smartRoutingService,
            UserRepository userRepository,
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository,
            ObjectMapper objectMapper
    ) {
        this.incidentRepository = incidentRepository;
        this.incidentEventRepository = incidentEventRepository;
        this.slaPolicyService = slaPolicyService;
        this.smartRoutingService = smartRoutingService;
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public IncidentResponse createIncident(CreateIncidentRequest request, UUID creatorId) {
        User creator = (creatorId != null) ? userRepository.findById(creatorId).orElse(null) : null;
        Team team = (request.getTeamId() != null) ? teamRepository.findById(request.getTeamId()).orElse(null) : null;

        // Generate unique formatted code: INC-<year>-<0000>
        long nextSeq = incidentRepository.getNextIncidentCodeSeq();
        int currentYear = Year.now().getValue();
        String code = String.format("INC-%d-%04d", currentYear, nextSeq);

        // Calculate SLA due timestamp
        SlaPolicy policy = slaPolicyService.getPolicyOrThrow(request.getPriority());
        Instant slaDueAt = Instant.now().plus(Duration.ofMinutes(policy.getResolveMinutes()));

        // Run Smart Routing
        SmartRoutingService.RoutingResult routing = smartRoutingService.routeIncident(
                request.getCategory(),
                request.getTeamId()
        );

        Incident incident = new Incident(
                code,
                request.getTitle(),
                request.getDescription(),
                request.getPriority(),
                (routing.winner() != null) ? IncidentStatus.OPEN : IncidentStatus.OPEN,
                request.getCategory(),
                team,
                creator,
                slaDueAt,
                request.getAssetId(),
                request.getRiskScore()
        );

        if (routing.winner() != null) {
            incident.setAssignee(routing.winner());
        }
        incident.setAssignmentExplanation(routing.explanationJson());

        Incident saved = incidentRepository.save(incident);

        // Log timeline events
        logEvent(saved, "CREATED", creator, Map.of(
                "priority", saved.getPriority().name(),
                "category", saved.getCategory(),
                "title", saved.getTitle()
        ));

        if (saved.getAssignee() != null) {
            logEvent(saved, "ASSIGNED", null, Map.of(
                    "assigneeId", saved.getAssignee().getId().toString(),
                    "assigneeName", saved.getAssignee().getFullName(),
                    "reason", "Auto-routed via Smart Routing engine"
            ));
        }

        return IncidentResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<IncidentResponse> getIncidents(
            String status,
            IncidentPriority priority,
            String category,
            UUID assigneeId,
            UUID teamId,
            String slaState,
            Boolean escalatedToMe,
            String q,
            Pageable pageable,
            UUID currentUserId
    ) {
        Specification<Incident> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();

            if (status != null && !status.isBlank()) {
                try {
                    IncidentStatus st = IncidentStatus.valueOf(status.toUpperCase());
                    predicates.add(cb.equal(root.get("status"), st));
                } catch (IllegalArgumentException ignored) {}
            }

            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }

            if (category != null && !category.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("category")), category.toLowerCase()));
            }

            if (assigneeId != null) {
                predicates.add(cb.equal(root.get("assignee").get("id"), assigneeId));
            }

            if (teamId != null) {
                predicates.add(cb.equal(root.get("team").get("id"), teamId));
            }

            if (Boolean.TRUE.equals(escalatedToMe) && currentUserId != null) {
                predicates.add(cb.equal(root.get("escalatedTo").get("id"), currentUserId));
            }

            if (q != null && !q.trim().isEmpty()) {
                String pattern = "%" + q.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("code")), pattern),
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Incident> page = incidentRepository.findAll(spec, pageable);
        List<IncidentResponse> list = page.getContent().stream()
                .map(IncidentResponse::from)
                .filter(res -> {
                    if (slaState == null || slaState.isBlank()) return true;
                    return res.getSlaState().name().equalsIgnoreCase(slaState);
                })
                .collect(Collectors.toList());

        return new PageResponse<>(list, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    @Transactional(readOnly = true)
    public IncidentDetailResponse getIncidentById(UUID id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Incident not found"));

        List<IncidentEvent> events = incidentEventRepository.findByIncidentIdOrderByCreatedAtAsc(id);
        return new IncidentDetailResponse(incident, events);
    }

    @Transactional
    public IncidentResponse updateStatus(UUID id, UpdateStatusRequest request, User actor) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Incident not found"));

        IncidentStatus fromStatus = incident.getStatus();
        IncidentStatus toStatus = request.getStatus();

        if (fromStatus == toStatus) {
            return IncidentResponse.from(incident);
        }

        // Validate state transitions
        validateStatusTransition(fromStatus, toStatus);

        incident.setStatus(toStatus);
        if (toStatus == IncidentStatus.RESOLVED) {
            incident.setResolvedAt(Instant.now());
        }
        if (fromStatus == IncidentStatus.OPEN && incident.getAcknowledgedAt() == null) {
            incident.setAcknowledgedAt(Instant.now());
        }

        Incident saved = incidentRepository.save(incident);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("fromStatus", fromStatus.name());
        payload.put("toStatus", toStatus.name());
        if (request.getNote() != null) {
            payload.put("note", request.getNote());
        }

        logEvent(saved, "STATUS_CHANGED", actor, payload);
        return IncidentResponse.from(saved);
    }

    @Transactional
    public IncidentResponse assignIncident(UUID id, AssignRequest request, User actor) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Incident not found"));

        User assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Assignee user not found"));

        incident.setAssignee(assignee);
        Incident saved = incidentRepository.save(incident);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("assigneeId", assignee.getId().toString());
        payload.put("assigneeName", assignee.getFullName());
        if (request.getReason() != null) {
            payload.put("reason", request.getReason());
        }

        logEvent(saved, "ASSIGNED", actor, payload);
        return IncidentResponse.from(saved);
    }

    @Transactional
    public IncidentResponse escalateIncident(UUID id, EscalateRequest request, User actor) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Incident not found"));

        if (incident.getEscalationLevel() >= 2) {
            throw new ApiException(ErrorCode.CONFLICT, "Incident has already reached maximum escalation level 2");
        }

        User targetUser = null;
        if (request.getToUserId() != null) {
            targetUser = userRepository.findById(request.getToUserId()).orElse(null);
        }

        // If not specified, escalate to Team Lead or SOC Admin
        if (targetUser == null && incident.getTeam() != null) {
            List<TeamMember> leads = teamMemberRepository.findTeamLeads(incident.getTeam().getId());
            if (!leads.isEmpty()) {
                targetUser = leads.get(0).getUser();
            }
        }

        if (targetUser == null) {
            targetUser = actor; // fallback
        }

        incident.setEscalationLevel(incident.getEscalationLevel() + 1);
        incident.setEscalatedTo(targetUser);

        Incident saved = incidentRepository.save(incident);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("level", saved.getEscalationLevel());
        payload.put("escalatedToId", targetUser != null ? targetUser.getId().toString() : null);
        payload.put("escalatedToName", targetUser != null ? targetUser.getFullName() : null);
        if (request.getReason() != null) {
            payload.put("reason", request.getReason());
        }

        logEvent(saved, "ESCALATED", actor, payload);
        return IncidentResponse.from(saved);
    }

    @Transactional
    public void addComment(UUID id, CommentRequest request, User actor) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Incident not found"));

        logEvent(incident, "COMMENT_ADDED", actor, Map.of("text", request.getText()));
    }

    @Transactional
    public IncidentResponse reopenIncident(UUID id, ReopenRequest request, User actor) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Incident not found"));

        if (incident.getStatus() != IncidentStatus.RESOLVED && incident.getStatus() != IncidentStatus.CLOSED) {
            throw new ApiException(ErrorCode.CONFLICT, "Only resolved or closed incidents can be reopened");
        }

        incident.setStatus(IncidentStatus.IN_PROGRESS);
        incident.setResolvedAt(null);
        Incident saved = incidentRepository.save(incident);

        logEvent(saved, "REOPENED", actor, Map.of("reason", request.getReason()));
        return IncidentResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<TimelineEventResponse> getTimeline(UUID incidentId) {
        return incidentEventRepository.findByIncidentIdOrderByCreatedAtAsc(incidentId).stream()
                .map(TimelineEventResponse::from)
                .collect(Collectors.toList());
    }

    private void validateStatusTransition(IncidentStatus from, IncidentStatus to) {
        boolean valid = switch (from) {
            case OPEN -> to == IncidentStatus.TRIAGED || to == IncidentStatus.IN_PROGRESS || to == IncidentStatus.RESOLVED;
            case TRIAGED -> to == IncidentStatus.IN_PROGRESS || to == IncidentStatus.RESOLVED;
            case IN_PROGRESS -> to == IncidentStatus.RESOLVED || to == IncidentStatus.CLOSED;
            case RESOLVED -> to == IncidentStatus.CLOSED || to == IncidentStatus.IN_PROGRESS;
            case CLOSED -> to == IncidentStatus.IN_PROGRESS;
        };

        if (!valid) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR,
                    String.format("Invalid status transition from %s to %s", from, to));
        }
    }

    private void logEvent(Incident incident, String type, User actor, Object payload) {
        try {
            String payloadJson = (payload != null) ? objectMapper.writeValueAsString(payload) : "{}";
            IncidentEvent event = new IncidentEvent(incident, type, actor, payloadJson);
            incidentEventRepository.save(event);
        } catch (Exception e) {
            IncidentEvent event = new IncidentEvent(incident, type, actor, "{}");
            incidentEventRepository.save(event);
        }
    }
}
