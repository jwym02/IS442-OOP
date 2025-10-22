package com.clinic.api.admin.dto;

import jakarta.validation.constraints.Pattern;

public class OperatingHoursRequest {
    // Expect HH:mm 24-hour format
    @Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "openTime must be HH:mm")
    private String openTime;
    @Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "closeTime must be HH:mm")
    private String closeTime;

    public String getOpenTime() { return openTime; }
    public void setOpenTime(String openTime) { this.openTime = openTime; }
    public String getCloseTime() { return closeTime; }
    public void setCloseTime(String closeTime) { this.closeTime = closeTime; }
}
