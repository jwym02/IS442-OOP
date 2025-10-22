package com.clinic.domain.notify;

import com.clinic.domain.enums.NotificationType;
import java.time.LocalDateTime;
import java.util.UUID;

public class Notification {
    private UUID notificationId;
    private String message;
    private NotificationType type;
    private LocalDateTime sentTime;

    public UUID getNotificationId() { return notificationId; }
    public void setNotificationId(UUID notificationId) { this.notificationId = notificationId; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }
    public LocalDateTime getSentTime() { return sentTime; }
    public void setSentTime(LocalDateTime sentTime) { this.sentTime = sentTime; }
}
