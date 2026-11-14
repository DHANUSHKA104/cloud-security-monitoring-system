package com.cloudsec.monitor.playbook;

import java.util.UUID;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlaybookExecutionService {

    private final PlaybookExecutionRepository executionRepository;
    private final PlaybookStepProgressRepository progressRepository;
    private final PlaybookService playbookService;

    public PlaybookExecutionService(
            PlaybookExecutionRepository executionRepository,
            PlaybookStepProgressRepository progressRepository,
            PlaybookService playbookService) {

        this.executionRepository = executionRepository;
        this.progressRepository = progressRepository;
        this.playbookService = playbookService;
    }

    @Transactional
    public PlaybookExecution createExecution(String category, UUID incidentId) {

        if (category == null || category.isBlank()) {
            throw new IllegalArgumentException("Category is required");
        }

        if (incidentId == null) {
            throw new IllegalArgumentException("Valid incident ID is required");
        }

        String normalizedCategory = category.trim().toUpperCase(Locale.ROOT);

        PlaybookExecution execution = executionRepository.save(
                new PlaybookExecution(normalizedCategory, incidentId));

        List<PlaybookStep> steps =
                playbookService.getPlaybook(normalizedCategory);

        List<PlaybookStepProgress> progressRecords = steps.stream()
                .map(step -> new PlaybookStepProgress(
                        execution,
                        step.getTitle(),
                        step.getDescription()))
                .toList();

        progressRepository.saveAll(progressRecords);

        return execution;
    }

    @Transactional(readOnly = true)
    public List<PlaybookExecution> getExecutionHistory() {
        return executionRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<PlaybookExecution> getExecutionHistoryByIncident(UUID incidentId) {

        if (incidentId == null) {
            throw new IllegalArgumentException("Valid incident ID is required");
        }

        return executionRepository
                .findByIncidentIdOrderByCreatedAtDesc(incidentId);
    }

    @Transactional
    public PlaybookExecution updateExecutionStatus(
            Long executionId, String newStatus) {

        if (executionId == null || executionId <= 0) {
            throw new IllegalArgumentException("Invalid execution ID");
        }

        if (newStatus == null ||
                !List.of("RUNNING", "COMPLETED", "FAILED").contains(newStatus)) {
            throw new IllegalArgumentException("Invalid execution status");
        }

        PlaybookExecution execution = executionRepository.findById(executionId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Execution not found"));

        execution.setExecutionStatus(newStatus);

        if (newStatus.equals("COMPLETED") || newStatus.equals("FAILED")) {
            execution.setCompletedAt(java.time.LocalDateTime.now());
        } else {
            execution.setCompletedAt(null);
        }

        return executionRepository.save(execution);
    }
}