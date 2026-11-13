package com.cloudsec.monitor.monitoring;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface SystemMetricRepository extends JpaRepository<SystemMetric, UUID> {
    List<SystemMetric> findAllByOrderByRecordedAtDesc(Pageable pageable);
}
