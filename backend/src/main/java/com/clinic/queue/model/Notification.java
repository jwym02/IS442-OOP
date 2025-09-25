package com.clinic.queue.model;

import java.time.LocalDateTime;

public class Notification {
    private long notificationId;
    private String message;
    private NotificationType notificationType;
    private LocalDateTime sentTime;

    public enum NotificationType { SMS, EMAIL }

    public long getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(long notificationId) {
        this.notificationId = notificationId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public NotificationType getNotificationType() {
        return notificationType;
    }

    public void setNotificationType(NotificationType notificationType) {
        this.notificationType = notificationType;
    }

    public LocalDateTime getSentTime() {
        return sentTime;
    }

    public void setSentTime(LocalDateTime sentTime) {
        this.sentTime = sentTime;
    }

    public void sendNotification(User user) {
        // TODO: implement
    }

    public void scheduleNotification(LocalDateTime time) {
        // TODO: implement
    }
}