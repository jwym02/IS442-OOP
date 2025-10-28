package com.clinic.api.admin.dto;

import jakarta.validation.constraints.NotBlank;

public class AssignRoleRequest {
    @NotBlank
    private String role;

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
