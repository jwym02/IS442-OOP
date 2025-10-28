package com.clinic.api.patients.dto;

import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

public class AppointmentRequest {
    @NotNull
    private Long doctorId;
    @NotNull
    private Long clinicId;
    @NotNull
    private OffsetDateTime dateTime;

    // getters and setters
    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
    public Long getClinicId() { return clinicId; }
    public void setClinicId(Long clinicId) { this.clinicId = clinicId; }
    public OffsetDateTime getDateTime() { return dateTime; }
    public void setDateTime(OffsetDateTime dateTime) { this.dateTime = dateTime; }
}
