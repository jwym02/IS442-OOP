package com.clinic.api.admin.dto;

import jakarta.validation.constraints.NotBlank;

public class RestoreRequest {
    @NotBlank
    private String backupId;

    public String getBackupId() {
        return backupId;
    }

    public void setBackupId(String backupId) {
        this.backupId = backupId;
    }
}

