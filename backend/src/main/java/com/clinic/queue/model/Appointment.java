package com.clinic.queue.model;

import java.time.LocalDateTime;

public class Appointment {
    private long appointmentId;
    private LocalDateTime dateTime;
    private Status status;

    public enum Status { CONFIRMED, CANCELLED, RESCHEDULED }

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

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public void confirm() {
        // TODO: implement
    }

    public void cancel() {
        // TODO: implement
    }

    public void reschedule(LocalDateTime newDateTime) {
        // TODO: implement
    }

    public String getDetails() {
        // TODO: implement
        return null;
    }
}

