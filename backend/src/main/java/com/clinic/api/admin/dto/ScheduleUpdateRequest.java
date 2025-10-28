package com.clinic.api.admin.dto;

import jakarta.validation.constraints.Min;

public class ScheduleUpdateRequest {
    @Min(1)
    private Integer slotIntervalMinutes;

    public Integer getSlotIntervalMinutes() { return slotIntervalMinutes; }
    public void setSlotIntervalMinutes(Integer slotIntervalMinutes) { this.slotIntervalMinutes = slotIntervalMinutes; }
}
