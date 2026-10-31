package com.cloudsec.monitor.user;

import com.cloudsec.monitor.auth.RefreshTokenService;
import com.cloudsec.monitor.auth.dto.UserResponse;
import com.cloudsec.monitor.common.dto.PageResponse;
import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import com.cloudsec.monitor.team.*;
import com.cloudsec.monitor.user.dto.CreateUserRequest;
import com.cloudsec.monitor.user.dto.UpdateUserRequest;
import com.cloudsec.monitor.user.dto.UserDetailResponse;
import com.cloudsec.monitor.user.dto.UserSkillRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final UserSkillRepository userSkillRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    public UserService(
            UserRepository userRepository,
            SkillRepository skillRepository,
            UserSkillRepository userSkillRepository,
            TeamMemberRepository teamMemberRepository,
            PasswordEncoder passwordEncoder,
            RefreshTokenService refreshTokenService
    ) {
        this.userRepository = userRepository;
        this.skillRepository = skillRepository;
        this.userSkillRepository = userSkillRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
    }

    public PageResponse<UserResponse> getUsers(String q, Role role, Boolean active, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();

            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }
            if (q != null && !q.trim().isEmpty()) {
                String pattern = "%" + q.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<User> page = userRepository.findAll(spec, pageable);
        List<UserResponse> list = page.getContent().stream().map(UserResponse::from).collect(Collectors.toList());
        return new PageResponse<>(list, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (request.getPassword().equalsIgnoreCase(request.getEmail())) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Password must be 10 to 72 characters and different from your email");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException(ErrorCode.CONFLICT, "A user with this email address already exists");
        }

        User user = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName(),
                request.getDepartment(),
                request.getRole()
        );

        User saved = userRepository.save(user);
        return UserResponse.from(saved);
    }

    // Fix B6: getUserById must be @Transactional(readOnly=true) so that lazy-loaded
    // associations (team on TeamMember) are resolved within an open Hibernate session.
    @Transactional(readOnly = true)
    public UserDetailResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found"));

        List<UserSkill> skills = userSkillRepository.findByUserId(id);
        List<UserDetailResponse.UserSkillDto> skillDtos = skills.stream()
                .map(s -> new UserDetailResponse.UserSkillDto(s.getSkill().getId(), s.getSkill().getName(), s.getLevel()))
                .collect(Collectors.toList());

        List<TeamMember> teamMembers = teamMemberRepository.findByUserId(id);
        List<UserDetailResponse.UserTeamDto> teamDtos = teamMembers.stream()
                .map(tm -> new UserDetailResponse.UserTeamDto(tm.getTeam().getId(), tm.getTeam().getName(), tm.getTeamRole().name()))
                .collect(Collectors.toList());

        return UserDetailResponse.from(user, skillDtos, teamDtos);
    }

    @Transactional
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found"));

        // Fix B2 & B3: Guard against deactivating or role-downgrading the last active ADMIN.
        // Check BEFORE applying any change so we compare against the current DB state.
        boolean isDeactivatingAdmin = user.getRole() == Role.ADMIN
                && Boolean.FALSE.equals(request.getActive())
                && user.isActive();

        boolean isDowngradingAdmin = user.getRole() == Role.ADMIN
                && request.getRole() != null
                && request.getRole() != Role.ADMIN;

        if (isDeactivatingAdmin || isDowngradingAdmin) {
            long activeAdminCount = userRepository.countActiveAdmins();
            if (activeAdminCount <= 1) {
                throw new ApiException(
                        ErrorCode.VALIDATION_ERROR,
                        "Cannot deactivate or downgrade the last active administrator. Promote another user to ADMIN first."
                );
            }
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }

        // Fix B1: Revoke all refresh tokens when a user is deactivated.
        // This ensures a deactivated user cannot obtain new access tokens via refresh,
        // even before the 15-minute access token expiry.
        if (request.getActive() != null) {
            boolean wasActive = user.isActive();
            user.setActive(request.getActive());
            if (wasActive && !request.getActive()) {
                refreshTokenService.revokeAllUserTokens(id);
            }
        }

        User saved = userRepository.save(user);
        return UserResponse.from(saved);
    }

    @Transactional
    public void updateUserSkills(UUID userId, List<UserSkillRequest> skillRequests) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found"));

        userSkillRepository.deleteByUserId(userId);

        if (skillRequests != null) {
            for (UserSkillRequest req : skillRequests) {
                Skill skill = skillRepository.findById(req.getSkillId())
                        .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Skill not found: " + req.getSkillId()));

                UserSkill userSkill = new UserSkill(user, skill, req.getLevel());
                userSkillRepository.save(userSkill);
            }
        }
    }
}
