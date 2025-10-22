package com.clinic.api.patients.dto;

public class QueueEntryResponse {
    private Long queueNumber;
    private String status;
    private Long appointmentId;
    private Long patientId;
    private Long clinicId;

    // getters and setters
    public Long getQueueNumber() { return queueNumber; }
    public void setQueueNumber(Long queueNumber) { this.queueNumber = queueNumber; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public Long getClinicId() { return clinicId; }
    public void setClinicId(Long clinicId) { this.clinicId = clinicId; }
}
