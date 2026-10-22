package com.cloudsec.monitor.incident;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SlaPolicyRepository extends JpaRepository<SlaPolicy, IncidentPriority> {
}
