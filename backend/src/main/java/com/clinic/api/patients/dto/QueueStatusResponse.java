package com.clinic.api.patients.dto;

public class QueueStatusResponse {
    private String status;
    private Long queueNumber;
    private Long clinicId;
    private Long patientId;
    private Integer currentNumber;
    private Integer numbersAway;
    private String state; // ACTIVE or PAUSED

    // getters and setters
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getQueueNumber() { return queueNumber; }
    public void setQueueNumber(Long queueNumber) { this.queueNumber = queueNumber; }
    public Long getClinicId() { return clinicId; }
    public void setClinicId(Long clinicId) { this.clinicId = clinicId; }
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public Integer getCurrentNumber() { return currentNumber; }
    public void setCurrentNumber(Integer currentNumber) { this.currentNumber = currentNumber; }
    public Integer getNumbersAway() { return numbersAway; }
    public void setNumbersAway(Integer numbersAway) { this.numbersAway = numbersAway; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
}
