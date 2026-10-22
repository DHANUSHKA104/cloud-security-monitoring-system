package com.cloudsec.monitor.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginResponse {
    private String accessToken;
    private Long expiresIn;
    private UserResponse user;
    private Boolean mfaRequired;
    private String mfaToken;

    public LoginResponse() {}

    public static LoginResponse success(String accessToken, long expiresIn, UserResponse user) {
        LoginResponse response = new LoginResponse();
        response.accessToken = accessToken;
        response.expiresIn = expiresIn;
        response.user = user;
        response.mfaRequired = false;
        return response;
    }

    public static LoginResponse mfaRequired(String mfaToken) {
        LoginResponse response = new LoginResponse();
        response.mfaRequired = true;
        response.mfaToken = mfaToken;
        return response;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public Long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(Long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public UserResponse getUser() {
        return user;
    }

    public void setUser(UserResponse user) {
        this.user = user;
    }

    public Boolean getMfaRequired() {
        return mfaRequired;
    }

    public void setMfaRequired(Boolean mfaRequired) {
        this.mfaRequired = mfaRequired;
    }

    public String getMfaToken() {
        return mfaToken;
    }

    public void setMfaToken(String mfaToken) {
        this.mfaToken = mfaToken;
    }
}
