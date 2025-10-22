package com.clinic.api.staff.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class QueueStatusUpdateRequest {
    @NotNull
    private Long clinicId;
    @NotBlank
    private String status; // WAITING, CALLED, SERVED, SKIPPED, FAST_TRACKED, CANCELLED

    public Long getClinicId() {
        return clinicId;
    }

    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
