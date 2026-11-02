package com.cloudsec.monitor.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByFullNameIgnoreCase(String fullName);

    boolean existsByEmail(String email);

    java.util.List<User> findByRole(Role role);

    java.util.List<User> findAllByFullNameIgnoreCaseAndActiveTrue(String fullName);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) FROM User u WHERE u.role = 'ADMIN' AND u.active = true")
    long countActiveAdmins();
}
