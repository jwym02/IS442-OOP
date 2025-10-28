package com.clinic.api.admin.dto;

import jakarta.validation.constraints.Min;

public class SlotIntervalRequest {

    @Min(1)
    private Integer minutes;

    public Integer getMinutes() {
        return minutes;
    }

    public void setMinutes(Integer minutes) {
        this.minutes = minutes;
    }
}
