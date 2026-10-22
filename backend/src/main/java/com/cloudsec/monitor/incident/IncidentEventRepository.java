package com.cloudsec.monitor.incident;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IncidentEventRepository extends JpaRepository<IncidentEvent, UUID> {

    List<IncidentEvent> findByIncidentIdOrderByCreatedAtAsc(UUID incidentId);

    List<IncidentEvent> findTop30ByOrderByCreatedAtDesc();

    boolean existsByIncidentIdAndType(UUID incidentId, String type);
}
