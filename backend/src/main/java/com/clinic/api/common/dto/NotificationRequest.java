package com.clinic.api.common.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class NotificationRequest {
    @NotNull
    private Long userId;
    @NotNull
    private String message;
    @NotNull
    private String type;
    private LocalDateTime sendAt;

    // getters and setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public LocalDateTime getSendAt() { return sendAt; }
    public void setSendAt(LocalDateTime sendAt) { this.sendAt = sendAt; }
}
