package com.clinic.api.patients.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request to update appointment status")
public class AppointmentStatusUpdateRequest {
    
    @NotNull(message = "Status is required")
    @Schema(description = "New status for the appointment", example = "NO_SHOW", 
            allowableValues = {"SCHEDULED", "CHECKED_IN", "IN_PROGRESS", "CANCELLED", "COMPLETED", "NO_SHOW"})
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
