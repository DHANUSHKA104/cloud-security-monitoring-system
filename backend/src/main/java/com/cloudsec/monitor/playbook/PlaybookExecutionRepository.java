package com.cloudsec.monitor.playbook;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PlaybookExecutionRepository
        extends JpaRepository<PlaybookExecution, Long> {

    List<PlaybookExecution> findAllByOrderByCreatedAtDesc();

    List<PlaybookExecution> findByIncidentIdOrderByCreatedAtDesc(UUID incidentId);
}