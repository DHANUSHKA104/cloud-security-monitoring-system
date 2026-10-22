package com.cloudsec.monitor.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SignupRequest {

    @NotBlank(message = "Enter your full name (2 to 100 characters)")
    @Size(min = 2, max = 100, message = "Enter your full name (2 to 100 characters)")
    private String fullName;

    @NotBlank(message = "Enter a valid email address")
    @Email(message = "Enter a valid email address")
    @Size(max = 254, message = "Enter a valid email address")
    private String email;

    @NotBlank(message = "Password must be 10 to 72 characters and different from your email")
    @Size(min = 10, max = 72, message = "Password must be 10 to 72 characters and different from your email")
    private String password;

    public SignupRequest() {}

    public SignupRequest(String fullName, String email, String password) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
