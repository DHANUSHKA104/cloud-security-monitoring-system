package com.cloudsec.monitor.incident;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, UUID>, JpaSpecificationExecutor<Incident> {

    Optional<Incident> findByCode(String code);

    boolean existsByCode(String code);

    @Query(value = "SELECT nextval('incident_code_seq')", nativeQuery = true)
    Long getNextIncidentCodeSeq();

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.assignee.id = :userId AND i.status NOT IN ('RESOLVED', 'CLOSED')")
    long countOpenIncidentsForUser(@Param("userId") UUID userId);

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.assignee.id = :userId AND i.category = :category AND i.status IN ('RESOLVED', 'CLOSED')")
    long countResolvedInCategoryForUser(@Param("userId") UUID userId, @Param("category") String category);

    @Query("SELECT i FROM Incident i WHERE i.status NOT IN ('RESOLVED', 'CLOSED') AND i.slaDueAt <= :threshold ORDER BY i.slaDueAt ASC")
    List<Incident> findAtRiskIncidents(@Param("threshold") Instant threshold);

    @Query("SELECT i FROM Incident i WHERE i.status NOT IN ('RESOLVED', 'CLOSED') ORDER BY i.slaDueAt ASC")
    List<Incident> findOpenIncidentsOrderedByDue();

    long countByStatusNotIn(java.util.Collection<IncidentStatus> statuses);

    long countByPriorityAndStatusNotIn(IncidentPriority priority, java.util.Collection<IncidentStatus> statuses);

    List<Incident> findByStatusNotIn(java.util.Collection<IncidentStatus> statuses);

    List<Incident> findByStatusIn(java.util.Collection<IncidentStatus> statuses);

    List<Incident> findByCreatedAtAfter(Instant after);

    List<Incident> findByAssigneeIdAndStatusNotIn(UUID assigneeId, java.util.Collection<IncidentStatus> statuses);
}
