package com.cloudsec.monitor.playbook;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlaybookRepository extends JpaRepository<Playbook, UUID> {

    Optional<Playbook> findByCategoryAndActiveTrue(String category);

    Optional<Playbook> findByCode(String code);

    List<Playbook> findByActiveTrue();
}
