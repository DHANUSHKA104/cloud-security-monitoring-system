package com.cloudsec.monitor.config;

import com.cloudsec.monitor.shift.Shift;
import com.cloudsec.monitor.shift.ShiftRepository;
import com.cloudsec.monitor.team.*;
import com.cloudsec.monitor.user.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Component
@Profile("dev")
public class DevDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataInitializer.class);

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final SkillRepository skillRepository;
    private final UserSkillRepository userSkillRepository;
    private final ShiftRepository shiftRepository;
    private final PasswordEncoder passwordEncoder;
    private final String devPassword;

    public DevDataInitializer(
            UserRepository userRepository,
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository,
            SkillRepository skillRepository,
            UserSkillRepository userSkillRepository,
            ShiftRepository shiftRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.seed.dev-password:change-me}") String devPassword
    ) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.skillRepository = skillRepository;
        this.userSkillRepository = userSkillRepository;
        this.shiftRepository = shiftRepository;
        this.passwordEncoder = passwordEncoder;
        this.devPassword = devPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Users already present, skipping dev data initialization.");
            return;
        }

        log.info("Seeding initial development users, SOC squads, skills and shifts...");
        String encodedPass = passwordEncoder.encode(devPassword);

        // 1. Users
        User admin = userRepository.save(new User("admin@cloudsec.local", encodedPass, "SOC Administrator", "Security Leadership", Role.ADMIN));
        User alice = userRepository.save(new User("alice.analyst@cloudsec.local", encodedPass, "Alice Analyst", "SOC Tier 2", Role.ANALYST));
        User bob = userRepository.save(new User("bob.analyst@cloudsec.local", encodedPass, "Bob Specialist", "Threat Intel", Role.ANALYST));
        userRepository.save(new User("ravi.kumar@cloudsec.local", encodedPass, "Ravi Kumar", "Compliance & Audit", Role.VIEWER));

        // 2. Teams
        Team cirTeam = teamRepository.save(new Team("Cloud Incident Response Squad", "24/7 Primary Response squad for cloud infrastructure alerts"));
        Team tiTeam = teamRepository.save(new Team("Threat Intelligence Unit", "IOC investigation, malware attribution and threat hunting"));

        // 3. Team Members
        teamMemberRepository.save(new TeamMember(cirTeam, alice, TeamRole.LEAD));
        teamMemberRepository.save(new TeamMember(cirTeam, bob, TeamRole.MEMBER));
        teamMemberRepository.save(new TeamMember(tiTeam, bob, TeamRole.LEAD));

        // 4. Skills mapping
        skillRepository.findByName("AWS Security").ifPresent(s -> userSkillRepository.save(new UserSkill(alice, s, 3)));
        skillRepository.findByName("Kubernetes").ifPresent(s -> userSkillRepository.save(new UserSkill(alice, s, 2)));
        skillRepository.findByName("Phishing").ifPresent(s -> userSkillRepository.save(new UserSkill(bob, s, 3)));
        skillRepository.findByName("Malware Analysis").ifPresent(s -> userSkillRepository.save(new UserSkill(bob, s, 2)));

        // 5. Scheduled Active Shift for Alice (on shift right now)
        Instant now = Instant.now();
        shiftRepository.save(new Shift(alice, now.minus(Duration.ofHours(2)), now.plus(Duration.ofHours(6)), admin.getId()));
        shiftRepository.save(new Shift(bob, now.plus(Duration.ofHours(6)), now.plus(Duration.ofHours(14)), admin.getId()));

        log.info("Development seed completed successfully. Admin login ready: admin@cloudsec.local");
    }
}
