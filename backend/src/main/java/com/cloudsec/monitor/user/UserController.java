package com.cloudsec.monitor.user;

import com.cloudsec.monitor.auth.dto.UserResponse;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

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
        String sortProp = sortParts[0];
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortProp));
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
