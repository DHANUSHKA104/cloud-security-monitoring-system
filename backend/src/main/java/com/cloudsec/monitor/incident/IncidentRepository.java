package com.cloudsec.monitor.incident;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
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

    @Query("SELECT i FROM Incident i WHERE i.assignee.id = :userId AND i.status NOT IN ('RESOLVED', 'CLOSED')")
    List<Incident> findOpenIncidentsForUser(@Param("userId") UUID userId);

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.assignee.id = :userId AND i.category = :category AND i.status IN ('RESOLVED', 'CLOSED')")
    long countResolvedInCategoryForUser(@Param("userId") UUID userId, @Param("category") String category);

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.assignee.id = :userId AND i.category = :category AND i.status IN ('RESOLVED', 'CLOSED') AND i.resolvedAt IS NOT NULL AND i.resolvedAt >= :cutoff")
    long countResolvedSinceByCategoryForUser(
            @Param("userId") UUID userId,
            @Param("category") String category,
            @Param("cutoff") Instant cutoff
    );

    @Query("SELECT i FROM Incident i WHERE i.status NOT IN ('RESOLVED', 'CLOSED') AND i.slaDueAt <= :threshold ORDER BY i.slaDueAt ASC")
    List<Incident> findAtRiskIncidents(@Param("threshold") Instant threshold);

    @Query("SELECT i FROM Incident i WHERE i.status NOT IN ('RESOLVED', 'CLOSED') ORDER BY i.slaDueAt ASC")
    List<Incident> findOpenIncidentsOrderedByDue();

    long countByStatusNotIn(Collection<IncidentStatus> statuses);

    long countByPriorityAndStatusNotIn(IncidentPriority priority, Collection<IncidentStatus> statuses);

    List<Incident> findByStatusNotIn(Collection<IncidentStatus> statuses);

    List<Incident> findByStatusIn(Collection<IncidentStatus> statuses);

    @Query("SELECT i FROM Incident i WHERE i.status IN ('RESOLVED', 'CLOSED') AND i.resolvedAt IS NOT NULL AND i.resolvedAt >= :cutoff")
    List<Incident> findResolvedSince(@Param("cutoff") Instant cutoff);

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.status IN ('RESOLVED', 'CLOSED') AND i.resolvedAt IS NOT NULL AND i.category = :category AND i.priority = :priority AND i.resolvedAt >= :cutoff")
    long countResolvedSinceByCategoryAndPriority(
            @Param("category") String category,
            @Param("priority") IncidentPriority priority,
            @Param("cutoff") Instant cutoff
    );

    @Query(value = "SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (resolved_at - created_at))) " +
                   "FROM incidents " +
                   "WHERE status IN ('RESOLVED', 'CLOSED') AND resolved_at IS NOT NULL " +
                   "AND category = :category AND priority = :priority " +
                   "AND resolved_at >= :cutoff", nativeQuery = true)
    Double findMedianResolutionSeconds(
            @Param("category") String category,
            @Param("priority") String priority,
            @Param("cutoff") Instant cutoff
    );

    List<Incident> findByCreatedAtAfter(Instant after);

    List<Incident> findByAssigneeIdAndStatusNotIn(UUID assigneeId, Collection<IncidentStatus> statuses);
}
