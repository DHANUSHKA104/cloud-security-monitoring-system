package com.cloudsec.monitor.playbook;

import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.incident.Incident;
import com.cloudsec.monitor.incident.IncidentEvent;
import com.cloudsec.monitor.incident.IncidentEventRepository;
import com.cloudsec.monitor.incident.IncidentRepository;
import com.cloudsec.monitor.playbook.dto.*;
import com.cloudsec.monitor.user.User;
import com.cloudsec.monitor.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PlaybookService {

    private static final Logger log = LoggerFactory.getLogger(PlaybookService.class);

    private final PlaybookRepository playbookRepository;
    private final PlaybookStepRepository playbookStepRepository;
    private final IncidentPlaybookExecutionRepository executionRepository;
    private final IncidentRepository incidentRepository;
    private final IncidentEventRepository incidentEventRepository;
    private final UserRepository userRepository;

    public PlaybookService(
            PlaybookRepository playbookRepository,
            PlaybookStepRepository playbookStepRepository,
            IncidentPlaybookExecutionRepository executionRepository,
            IncidentRepository incidentRepository,
            IncidentEventRepository incidentEventRepository,
            UserRepository userRepository
    ) {
        this.playbookRepository = playbookRepository;
        this.playbookStepRepository = playbookStepRepository;
        this.executionRepository = executionRepository;
        this.incidentRepository = incidentRepository;
        this.incidentEventRepository = incidentEventRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<PlaybookResponse> getAllPlaybooks() {
        List<Playbook> playbooks = playbookRepository.findByActiveTrue();
        for (Playbook pb : playbooks) {
            pb.setSteps(playbookStepRepository.findByPlaybookIdOrderByStepOrderAsc(pb.getId()));
        }
        return playbooks.stream().map(PlaybookResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlaybookResponse getPlaybookByCategory(String category) {
        Playbook pb = playbookRepository.findByCategoryAndActiveTrue(category)
                .or(() -> playbookRepository.findByCategoryAndActiveTrue("OTHER"))
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "No playbook found for category: " + category));

        pb.setSteps(playbookStepRepository.findByPlaybookIdOrderByStepOrderAsc(pb.getId()));
        return PlaybookResponse.fromEntity(pb);
    }

    @Transactional(readOnly = true)
    public IncidentPlaybookStatusResponse getPlaybookForIncident(UUID incidentId) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Incident not found with ID: " + incidentId));

        Playbook pb = playbookRepository.findByCategoryAndActiveTrue(incident.getCategory())
                .or(() -> playbookRepository.findByCategoryAndActiveTrue("OTHER"))
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "No response playbook configured for category: " + incident.getCategory()));

        List<PlaybookStep> steps = playbookStepRepository.findByPlaybookIdOrderByStepOrderAsc(pb.getId());
        List<IncidentPlaybookExecution> executions = executionRepository.findByIncidentId(incidentId);

        Map<UUID, IncidentPlaybookExecution> executionMap = executions.stream()
                .collect(Collectors.toMap(IncidentPlaybookExecution::getStepId, e -> e, (e1, e2) -> e1));

        IncidentPlaybookStatusResponse response = new IncidentPlaybookStatusResponse();
        response.setIncidentId(incidentId);
        response.setPlaybookId(pb.getId());
        response.setPlaybookCode(pb.getCode());
        response.setPlaybookTitle(pb.getTitle());
        response.setCategory(pb.getCategory());
        response.setTotalSteps(steps.size());

        int completed = 0;
        List<IncidentPlaybookStatusResponse.StepExecutionDetail> details = new ArrayList<>();
        for (PlaybookStep step : steps) {
            IncidentPlaybookStatusResponse.StepExecutionDetail d = new IncidentPlaybookStatusResponse.StepExecutionDetail();
            d.setStepId(step.getId());
            d.setStepOrder(step.getStepOrder());
            d.setName(step.getName());
            d.setInstructions(step.getInstructions());
            d.setActionType(step.getActionType());
            d.setRiskLevel(step.getRiskLevel());

            IncidentPlaybookExecution exec = executionMap.get(step.getId());
            if (exec != null) {
                d.setExecuted(true);
                d.setStatus(exec.getStatus());
                d.setNotes(exec.getNotes());
                d.setExecutedAt(exec.getExecutedAt());
                if (exec.getExecutedBy() != null) {
                    d.setExecutedByName(exec.getExecutedBy().getFullName());
                }
                if ("COMPLETED".equalsIgnoreCase(exec.getStatus())) {
                    completed++;
                }
            } else {
                d.setExecuted(false);
                d.setStatus("PENDING");
            }
            details.add(d);
        }

        response.setCompletedSteps(completed);
        response.setSteps(details);
        return response;
    }

    @Transactional
    public ExecutePlaybookStepResponse executeStep(
            UUID incidentId,
            UUID stepId,
            ExecutePlaybookStepRequest req,
            UUID userId
    ) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Incident not found with ID: " + incidentId));

        PlaybookStep step = playbookStepRepository.findById(stepId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Playbook step not found with ID: " + stepId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found with ID: " + userId));

        Optional<IncidentPlaybookExecution> existing = executionRepository.findByIncidentIdAndStepId(incidentId, stepId);
        IncidentPlaybookExecution exec;
        if (existing.isPresent()) {
            exec = existing.get();
            exec.setStatus(req.getStatus() != null ? req.getStatus() : "COMPLETED");
            exec.setNotes(req.getNotes());
            exec.setExecutedBy(user);
            exec.setExecutedAt(Instant.now());
        } else {
            exec = new IncidentPlaybookExecution(
                    incidentId,
                    step.getPlaybook().getId(),
                    stepId,
                    user,
                    req.getStatus() != null ? req.getStatus() : "COMPLETED",
                    req.getNotes()
            );
        }

        IncidentPlaybookExecution saved = executionRepository.save(exec);

        // Record audit event in incident timeline
        String details = String.format(
                "{\"stepOrder\": %d, \"stepName\": \"%s\", \"actionType\": \"%s\", \"status\": \"%s\", \"notes\": \"%s\"}",
                step.getStepOrder(),
                step.getName().replace("\"", "\\\""),
                step.getActionType(),
                saved.getStatus(),
                saved.getNotes() != null ? saved.getNotes().replace("\"", "\\\"") : ""
        );
        incidentEventRepository.save(new IncidentEvent(
                incident,
                "PLAYBOOK_STEP_EXECUTED",
                user,
                details
        ));

        log.info("Playbook step {} for incident {} executed with status {}", step.getName(), incident.getCode(), saved.getStatus());
        return ExecutePlaybookStepResponse.fromEntity(saved);
    }
}
