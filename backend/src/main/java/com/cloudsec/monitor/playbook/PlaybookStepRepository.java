package com.cloudsec.monitor.playbook;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlaybookStepRepository extends JpaRepository<PlaybookStep, UUID> {

    List<PlaybookStep> findByPlaybookIdOrderByStepOrderAsc(UUID playbookId);

    Optional<PlaybookStep> findByIdAndPlaybookId(UUID id, UUID playbookId);
}
