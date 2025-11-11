package com.clinic.api.admin.dto;

import jakarta.validation.constraints.NotBlank;

public class AssignRoleRequest {
    @NotBlank
    private String role;
    private Long clinicId;

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Long getClinicId() {
        return clinicId;
    }

    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }
}
