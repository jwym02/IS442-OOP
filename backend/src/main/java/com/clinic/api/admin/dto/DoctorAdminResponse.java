package com.clinic.api.admin.dto;

public class DoctorAdminResponse {
    private Long id;
    private String fullName;
    private Long clinicId;
    private String speciality;
    private Integer slotIntervalMinutes;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Long getClinicId() {
        return clinicId;
    }

    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }

    public String getSpeciality() {
        return speciality;
    }

    public void setSpeciality(String speciality) {
        this.speciality = speciality;
    }

    public Integer getSlotIntervalMinutes() {
        return slotIntervalMinutes;
    }

    public void setSlotIntervalMinutes(Integer slotIntervalMinutes) {
        this.slotIntervalMinutes = slotIntervalMinutes;
    }
}
