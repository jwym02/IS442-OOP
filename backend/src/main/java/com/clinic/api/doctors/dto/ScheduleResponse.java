package com.clinic.api.doctors.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ScheduleResponse {
    private Long doctorId;
    private Integer slotIntervalMinutes;
    private List<LocalDateTime> availableSlots;

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
    public Integer getSlotIntervalMinutes() { return slotIntervalMinutes; }
    public void setSlotIntervalMinutes(Integer slotIntervalMinutes) { this.slotIntervalMinutes = slotIntervalMinutes; }
    public List<LocalDateTime> getAvailableSlots() { return availableSlots; }
    public void setAvailableSlots(List<LocalDateTime> availableSlots) { this.availableSlots = availableSlots; }
}
