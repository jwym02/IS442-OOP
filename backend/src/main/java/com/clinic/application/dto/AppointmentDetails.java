package com.clinic.application.dto;

import java.time.LocalDateTime;

public class AppointmentDetails {
    public Long id;
    public LocalDateTime dateTime;
    public String status;
    public Long clinicId;
    public String clinicName;
    public Long doctorId;
    public String doctorName;
    public Long patientId;
    public String patientName;
    public String queueNumber;

    public AppointmentDetails() {}
}