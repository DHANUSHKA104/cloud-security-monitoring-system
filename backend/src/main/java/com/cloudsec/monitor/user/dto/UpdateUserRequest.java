package com.cloudsec.monitor.user.dto;

import com.cloudsec.monitor.user.Role;
import jakarta.validation.constraints.Size;

public class UpdateUserRequest {

    @Size(min = 2, max = 100, message = "Enter your full name (2 to 100 characters)")
    private String fullName;

    @Size(max = 100, message = "Department is too long")
    private String department;

    private Role role;

    private Boolean active;

    public UpdateUserRequest() {}

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

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
