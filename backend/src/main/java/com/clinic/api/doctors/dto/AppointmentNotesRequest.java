package com.clinic.api.doctors.dto;

public class AppointmentNotesRequest {
    private Long doctorId;
    private Long appointmentId;
    private String notes;

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
