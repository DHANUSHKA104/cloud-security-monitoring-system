
package com.cloudsec.monitor.playbook;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

@Service
public class PlaybookStepTrackingService {

    private final PlaybookStepProgressRepository progressRepository;

    public PlaybookStepTrackingService(
            PlaybookStepProgressRepository progressRepository) {
        this.progressRepository = progressRepository;
    }

    @Transactional
    public PlaybookStepProgress updateStatus(
            Long stepId, PlaybookStepStatus newStatus) {

        if (stepId == null || stepId <= 0) {
            throw new IllegalArgumentException("Invalid step ID");
        }

        if (newStatus == null) {
            throw new IllegalArgumentException("Status is required");
        }

        PlaybookStepProgress step = progressRepository.findById(stepId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Playbook step not found"));

        step.setStatus(newStatus);

        return progressRepository.save(step);
    }

    @Transactional(readOnly = true)
    public List<PlaybookStepProgress> getStepsByExecutionId(
            Long executionId) {

        if (executionId == null || executionId <= 0) {
            throw new IllegalArgumentException("Invalid execution ID");
        }

        return progressRepository.findByExecutionId(executionId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getProgressSummary(Long executionId) {

        List<PlaybookStepProgress> steps =
                getStepsByExecutionId(executionId);

        long total = steps.size();
        long completed = 0;
        long pending = 0;
        long inProgress = 0;
        long failed = 0;

        for (PlaybookStepProgress step : steps) {

            switch (step.getStatus()) {
                case COMPLETED -> completed++;
                case PENDING -> pending++;
                case IN_PROGRESS -> inProgress++;
                case FAILED -> failed++;
            }
        }

        int percentage = total == 0 ? 0 :
                (int) Math.round(completed * 100.0 / total);

        Map<String, Object> summary = new LinkedHashMap<>();

        summary.put("executionId", executionId);
        summary.put("totalSteps", total);
        summary.put("completedSteps", completed);
        summary.put("pendingSteps", pending);
        summary.put("inProgressSteps", inProgress);
        summary.put("failedSteps", failed);
        summary.put("progressPercentage", percentage);

        return summary;
    }
}
