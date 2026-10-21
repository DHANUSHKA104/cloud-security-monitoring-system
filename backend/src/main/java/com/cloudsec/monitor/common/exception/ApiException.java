package com.cloudsec.monitor.common.exception;

import com.cloudsec.monitor.common.dto.ValidationErrorDetail;

import java.util.ArrayList;
import java.util.List;

public class ApiException extends RuntimeException {
    private final ErrorCode errorCode;
    private final List<ValidationErrorDetail> details;

    public ApiException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
        this.details = new ArrayList<>();
    }

    public ApiException(ErrorCode errorCode, String message, List<ValidationErrorDetail> details) {
        super(message);
        this.errorCode = errorCode;
        this.details = details != null ? details : new ArrayList<>();
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public List<ValidationErrorDetail> getDetails() {
        return details;
    }
}
