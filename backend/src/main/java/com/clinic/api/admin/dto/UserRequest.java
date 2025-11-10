package com.clinic.api.admin.dto;

import jakarta.validation.constraints.NotBlank;

public class UserRequest {
    @NotBlank
    private String email;
    private String password;
    @NotBlank
    private String role;
    private String name;
    private String phone;
    private Long clinicId;
    private Boolean doctor;
    private String specialty;
    private String birthDate;

    // getters and setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Long getClinicId() { return clinicId; }
    public void setClinicId(Long clinicId) { this.clinicId = clinicId; }
    public Boolean getDoctor() { return doctor; }
    public void setDoctor(Boolean doctor) { this.doctor = doctor; }
    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }
    public String getBirthDate() { return birthDate; }
    public void setBirthDate(String birthDate) { this.birthDate = birthDate; }
}
