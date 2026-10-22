package com.cloudsec.monitor.team;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserSkillRepository extends JpaRepository<UserSkill, UserSkillId> {

    @Query("SELECT us FROM UserSkill us JOIN FETCH us.skill WHERE us.user.id = :userId")
    List<UserSkill> findByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM UserSkill us WHERE us.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
