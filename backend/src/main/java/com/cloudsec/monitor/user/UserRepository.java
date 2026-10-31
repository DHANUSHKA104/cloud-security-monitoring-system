package com.cloudsec.monitor.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    java.util.List<User> findByRole(Role role);

    /**
     * Returns the number of active users with the ADMIN role.
     * Used by the last-admin lockout guard in UserService.updateUser().
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'ADMIN' AND u.active = true")
    long countActiveAdmins();
}
