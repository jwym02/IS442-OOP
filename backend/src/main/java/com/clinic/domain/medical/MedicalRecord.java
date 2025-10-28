package com.clinic.domain.medical;

import java.time.LocalDateTime;
import java.util.UUID;

public class MedicalRecord {
    private UUID recordId;
    private String treatmentSummary;
    private LocalDateTime appointmentDate;

    public UUID getRecordId() { return recordId; }
    public void setRecordId(UUID recordId) { this.recordId = recordId; }
    public String getTreatmentSummary() { return treatmentSummary; }
    public void setTreatmentSummary(String treatmentSummary) { this.treatmentSummary = treatmentSummary; }
    public LocalDateTime getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDateTime appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getSummary() {
        return treatmentSummary != null ? treatmentSummary : "";
    }
}
