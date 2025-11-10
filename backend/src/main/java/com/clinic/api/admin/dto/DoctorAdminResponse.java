package com.clinic.api.admin.dto;

public class DoctorAdminResponse {
    private Long id;
    private String fullName;
    private String specialty;
    private Long clinicId;
    private Long specialistId;
    // AdminService expects a slot interval setter/getter
    private Integer slotIntervalMinutes;

    public DoctorAdminResponse() {}

    public DoctorAdminResponse(Long id, String fullName, String specialty, Long clinicId, Long specialistId) {
        this.id = id;
        this.fullName = fullName;
        this.specialty = specialty;
        this.clinicId = clinicId;
        this.specialistId = specialistId;
    }

    // alias methods to match other parts of code that use "specialty" spelling
    public String getSpecialty() { return this.specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }

    // slot interval accessor expected by AdminService
    public Integer getSlotIntervalMinutes() { return this.slotIntervalMinutes; }
    public void setSlotIntervalMinutes(Integer slotIntervalMinutes) { this.slotIntervalMinutes = slotIntervalMinutes; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }
    public Long getClinicId() { return clinicId; }
    public void setClinicId(Long clinicId) { this.clinicId = clinicId; }
    public Long getSpecialistId() { return specialistId; }
    public void setSpecialistId(Long specialistId) { this.specialistId = specialistId; }
}
