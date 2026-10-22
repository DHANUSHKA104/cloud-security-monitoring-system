package com.cloudsec.monitor.incident;

import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.incident.dto.SlaPolicyResponse;
import com.cloudsec.monitor.incident.dto.UpdateSlaPolicyRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SlaPolicyService {

    private final SlaPolicyRepository slaPolicyRepository;

    public SlaPolicyService(SlaPolicyRepository slaPolicyRepository) {
        this.slaPolicyRepository = slaPolicyRepository;
    }

    public List<SlaPolicyResponse> getPolicies() {
        return slaPolicyRepository.findAll().stream()
                .map(SlaPolicyResponse::from)
                .collect(Collectors.toList());
    }

    public SlaPolicy getPolicyOrThrow(IncidentPriority priority) {
        return slaPolicyRepository.findById(priority)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "SLA policy not found for " + priority));
    }

    @Transactional
    public SlaPolicyResponse updatePolicy(IncidentPriority priority, UpdateSlaPolicyRequest request) {
        SlaPolicy policy = getPolicyOrThrow(priority);
        policy.setResolveMinutes(request.getResolveMinutes());
        policy.setFirstEscalationPct(request.getFirstEscalationPct());
        policy.setSecondEscalationPct(request.getSecondEscalationPct());
        SlaPolicy saved = slaPolicyRepository.save(policy);
        return SlaPolicyResponse.from(saved);
    }
}
