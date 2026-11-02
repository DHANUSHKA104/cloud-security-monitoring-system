package com.cloudsec.monitor.user;

import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.user.dto.UpdateUserRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class UserServiceConcurrencyIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Verify concurrent deactivation of the last two admins is serialized by pg_advisory_xact_lock(42)")
    void testConcurrentAdminDeactivation() throws Exception {
        // Setup: Create two active admin users
        String email1 = "concurrent_admin1_" + UUID.randomUUID() + "@cloudsec.local";
        String email2 = "concurrent_admin2_" + UUID.randomUUID() + "@cloudsec.local";

        User admin1 = userRepository.save(new User(email1, "hash1", "Admin One", "SOC", Role.ADMIN));
        User admin2 = userRepository.save(new User(email2, "hash2", "Admin Two", "SOC", Role.ADMIN));

        // Make sure only these 2 are the subject (or existing admins + these 2)
        long initialActiveAdmins = userRepository.countActiveAdmins();
        assertTrue(initialActiveAdmins >= 2, "Must have at least 2 active admins for concurrency test");

        // We will deactivate admin1 and admin2 simultaneously
        // If initialActiveAdmins was 2, exactly ONE must succeed and ONE must fail with CONFLICT.
        // If there are other existing admins (e.g. system admin), let's temporarily deactivate others or test down to the boundary.
        // To precisely test the last-admin boundary, let's create a scenario where countActiveAdmins() == 2.
        
        // Deactivate all admins except admin1 and admin2
        userRepository.findAll().forEach(u -> {
            if (u.getRole() == Role.ADMIN && !u.getId().equals(admin1.getId()) && !u.getId().equals(admin2.getId()) && u.isActive()) {
                u.setActive(false);
                userRepository.save(u);
            }
        });

        assertEquals(2, userRepository.countActiveAdmins(), "Precondition: Exactly 2 active admins must exist");

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        UpdateUserRequest deactReq = new UpdateUserRequest();
        deactReq.setActive(false);

        Future<?> f1 = executor.submit(() -> {
            readyLatch.countDown();
            try {
                startLatch.await();
                userService.updateUser(admin1.getId(), deactReq);
                successCount.incrementAndGet();
            } catch (ApiException e) {
                if (e.getErrorCode() == ErrorCode.CONFLICT) {
                    conflictCount.incrementAndGet();
                }
            } catch (Exception e) {
                // ignore
            }
        });

        Future<?> f2 = executor.submit(() -> {
            readyLatch.countDown();
            try {
                startLatch.await();
                userService.updateUser(admin2.getId(), deactReq);
                successCount.incrementAndGet();
            } catch (ApiException e) {
                if (e.getErrorCode() == ErrorCode.CONFLICT) {
                    conflictCount.incrementAndGet();
                }
            } catch (Exception e) {
                // ignore
            }
        });

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown(); // Fire both simultaneous requests!

        f1.get(10, TimeUnit.SECONDS);
        f2.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Verification:
        // Exactly ONE transaction must have succeeded and deactivated an admin
        // Exactly ONE transaction must have been blocked by pg_advisory_xact_lock(42) and rejected with CONFLICT!
        assertEquals(1, successCount.get(), "Exactly one concurrent deactivation must succeed");
        assertEquals(1, conflictCount.get(), "Exactly one concurrent deactivation must fail with CONFLICT");
        assertEquals(1, userRepository.countActiveAdmins(), "Exactly 1 active admin must remain in database");

        // Restore: Reactivate default admin if needed
        userRepository.findByEmail("admin@cloudsec.local").ifPresent(admin -> {
            admin.setActive(true);
            userRepository.save(admin);
        });
    }
}
