package com.clinic.queue.entity;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Objects;

public class Appointment {
    private static final DateTimeFormatter DETAILS_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private long appointmentId;
    private LocalDateTime dateTime;
    private AppointmentStatus status;

    public enum AppointmentStatus { CONFIRMED, CANCELLED, RESCHEDULED }

    public long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }

    public void confirm() {
        if (dateTime == null) {
            throw new IllegalStateException("Cannot confirm an appointment without a scheduled date/time.");
        }
        status = AppointmentStatus.CONFIRMED;
    }

    public void cancel() {
        status = AppointmentStatus.CANCELLED;
    }

    public void reschedule(LocalDateTime newDateTime) {
        Objects.requireNonNull(newDateTime, "newDateTime");
        if (status == AppointmentStatus.CANCELLED) {
            throw new IllegalStateException("Cancelled appointments cannot be rescheduled.");
        }
        dateTime = newDateTime;
        status = AppointmentStatus.RESCHEDULED;
    }

    public String getDetails() {
        String formattedDate = dateTime != null ? dateTime.format(DETAILS_FORMATTER) : "unscheduled";
        String statusLabel = status != null ? status.name() : "UNKNOWN";
        return String.format("Appointment #%d on %s (%s)", appointmentId, formattedDate, statusLabel);
    }
}

