package com.cloudsec.monitor.playbook;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IncidentPlaybookExecutionRepository extends JpaRepository<IncidentPlaybookExecution, UUID> {

    List<IncidentPlaybookExecution> findByIncidentId(UUID incidentId);

    Optional<IncidentPlaybookExecution> findByIncidentIdAndStepId(UUID incidentId, UUID stepId);

    long countByIncidentId(UUID incidentId);

    long countByStatus(String status);
}
