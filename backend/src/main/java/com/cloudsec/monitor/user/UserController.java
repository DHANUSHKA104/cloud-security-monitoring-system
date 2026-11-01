package com.cloudsec.monitor.user;

import com.cloudsec.monitor.auth.dto.UserResponse;
import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;

import com.cloudsec.monitor.common.dto.PageResponse;
import com.cloudsec.monitor.user.dto.CreateUserRequest;
import com.cloudsec.monitor.user.dto.UpdateUserRequest;
import com.cloudsec.monitor.user.dto.UserDetailResponse;
import com.cloudsec.monitor.user.dto.UserSkillRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    /**
     * Allowlist of User entity field names that callers may sort by.
     * Any other value is rejected with HTTP 400 to prevent PropertyReferenceException → 500.
     */
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "createdAt", "updatedAt", "fullName", "email", "role", "department", "active"
    );

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<UserResponse>> getUsers(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        String[] sortParts = sort.split(",");
        String sortProp = sortParts[0].trim();
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].trim().equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        // Fix B5: Validate sort field against the allowlist before building PageRequest.
        // An unknown field would cause Spring Data to throw PropertyReferenceException → 500.
        if (!ALLOWED_SORT_FIELDS.contains(sortProp)) {
            throw new ApiException(
                    ErrorCode.VALIDATION_ERROR,
                    "Invalid sort field '" + sortProp + "'. Allowed values: " + ALLOWED_SORT_FIELDS
            );
        }

        if (page < 0) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Page index must not be less than zero");
        }
        int safeSize = Math.min(100, Math.max(1, size));
        PageRequest pageRequest = PageRequest.of(page, safeSize, Sort.by(direction, sortProp));
        return ResponseEntity.ok(userService.getUsers(q, role, active, pageRequest));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse created = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ResponseEntity<UserDetailResponse> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @PutMapping("/{id}/skills")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateUserSkills(
            @PathVariable UUID id,
            @Valid @RequestBody List<UserSkillRequest> skills
    ) {
        userService.updateUserSkills(id, skills);
        return ResponseEntity.noContent().build();
    }
}
