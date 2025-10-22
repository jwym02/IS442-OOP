package com.clinic.domain.user;

public class ClinicStaff extends User {
    private Long staffProfileId;
    private Long assignedClinicId;

    public ClinicStaff() {
    }

    public ClinicStaff(Long staffProfileId, Long assignedClinicId) {
        this.staffProfileId = staffProfileId;
        this.assignedClinicId = assignedClinicId;
    }

    public Long getStaffProfileId() {
        return staffProfileId;
    }

    public void setStaffProfileId(Long staffProfileId) {
        this.staffProfileId = staffProfileId;
    }

    public Long getAssignedClinicId() {
        return assignedClinicId;
    }

    public void setAssignedClinicId(Long assignedClinicId) {
        this.assignedClinicId = assignedClinicId;
    }
}
