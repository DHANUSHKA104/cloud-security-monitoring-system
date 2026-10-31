package com.cloudsec.monitor.team;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, TeamMemberId> {

    @Query("SELECT tm FROM TeamMember tm JOIN FETCH tm.user WHERE tm.team.id = :teamId")
    List<TeamMember> findByTeamId(@Param("teamId") UUID teamId);

    /**
     * Fix B6: JOIN FETCH tm.team so that getTeam().getId() and getTeam().getName()
     * are safe to call when accessed outside a transaction (e.g. UserService.getUserById).
     * The @Transactional(readOnly=true) on getUserById now makes this robust regardless.
     */
    @Query("SELECT tm FROM TeamMember tm JOIN FETCH tm.team WHERE tm.user.id = :userId")
    List<TeamMember> findByUserId(@Param("userId") UUID userId);

    Optional<TeamMember> findByTeamIdAndUserId(UUID teamId, UUID userId);

    @Query("SELECT tm FROM TeamMember tm JOIN FETCH tm.user WHERE tm.team.id = :teamId AND tm.teamRole = 'LEAD'")
    List<TeamMember> findTeamLeads(@Param("teamId") UUID teamId);

    void deleteByTeamIdAndUserId(UUID teamId, UUID userId);
}
