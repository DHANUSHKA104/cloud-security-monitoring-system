package com.cloudsec.monitor.shift;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, UUID>, JpaSpecificationExecutor<Shift> {

    @Query("SELECT s FROM Shift s JOIN FETCH s.user u WHERE " +
           "s.startsAt <= :now AND s.endsAt > :now AND u.active = true")
    List<Shift> findActiveShiftsOnNow(@Param("now") Instant now);

    @Query("SELECT s FROM Shift s JOIN FETCH s.user u " +
           "JOIN TeamMember tm ON tm.id.userId = u.id " +
           "WHERE tm.id.teamId = :teamId AND s.startsAt <= :now AND s.endsAt > :now AND u.active = true")
    List<Shift> findActiveTeamShiftsOnNow(@Param("teamId") UUID teamId, @Param("now") Instant now);

    @Query("SELECT s FROM Shift s WHERE s.user.id = :userId AND " +
           "((s.startsAt < :endsAt AND s.endsAt > :startsAt))")
    List<Shift> findOverlappingShifts(
            @Param("userId") UUID userId,
            @Param("startsAt") Instant startsAt,
            @Param("endsAt") Instant endsAt
    );
}
