package com.cloudsec.monitor.user.dto;

import com.cloudsec.monitor.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateUserRequest {

    @NotBlank(message = "Enter a valid email address")
    @Email(message = "Enter a valid email address")
    @Size(max = 254, message = "Enter a valid email address")
    private String email;

    @NotBlank(message = "Enter your full name (2 to 100 characters)")
    @Size(min = 2, max = 100, message = "Enter your full name (2 to 100 characters)")
    private String fullName;

    @Size(max = 100, message = "Department is too long")
    private String department;

    @NotNull(message = "Role is required")
    private Role role;

    @NotBlank(message = "Password must be 10 to 72 characters and different from your email")
    @Size(min = 10, max = 72, message = "Password must be 10 to 72 characters and different from your email")
    private String password;

    public CreateUserRequest() {}

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
