package com.clinic.api.patients.dto;

public class AppointmentRequest {
    private Long clinicId;
    private Long doctorId;
    private Long specialistId;
    private Object dateTime;

    public Long getClinicId() {
        return clinicId;
    }
    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }
    public Long getDoctorId() {
        return doctorId;
    }
    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }
    public Long getSpecialistId() { return specialistId; }
    public void setSpecialistId(Long specialistId) { this.specialistId = specialistId; }
    public Object getDateTime() {
        return dateTime;
    }
    public void setDateTime(Object dateTime) {
        this.dateTime = dateTime;
    }
}
