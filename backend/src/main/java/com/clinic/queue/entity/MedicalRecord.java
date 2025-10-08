package com.clinic.queue.entity;
import java.time.LocalDateTime;

public class MedicalRecord {
    private long recordId;
    private String treatmentSummary;
    private LocalDateTime appointmentDate;

    public long getRecordId() {
        return recordId;
    }

    public void setRecordId(long recordId) {
        this.recordId = recordId;
    }

    public String getTreatmentSummary() {
        return treatmentSummary;
    }

    public void setTreatmentSummary(String treatmentSummary) {
        this.treatmentSummary = treatmentSummary;
    }

    public LocalDateTime getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(LocalDateTime appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public String getSummary() {
        // TODO: implement
        return null;
    }
}

