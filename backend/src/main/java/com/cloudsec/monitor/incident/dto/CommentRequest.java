package com.cloudsec.monitor.incident.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CommentRequest {

    @NotBlank(message = "Comment text cannot be blank")
    @Size(max = 2000, message = "Comment cannot exceed 2000 characters")
    private String text;

    public CommentRequest() {}

    public CommentRequest(String text) {
        this.text = text;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}
