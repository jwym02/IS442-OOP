package com.clinic.api.admin.dto;

import java.util.List;

public class UserResponse {
    private String id;
    private String email;
    private String name;
    private String phone;
    private List<String> roles;
    private Long patientProfileId;
    private Long staffProfileId;
    private Long doctorProfileId;
    private Long adminProfileId;
    private Long staffClinicId;
    private Long doctorClinicId;
    private String speciality;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    public Long getPatientProfileId() {
        return patientProfileId;
    }

    public void setPatientProfileId(Long patientProfileId) {
        this.patientProfileId = patientProfileId;
    }

    public Long getStaffProfileId() {
        return staffProfileId;
    }

    public void setStaffProfileId(Long staffProfileId) {
        this.staffProfileId = staffProfileId;
    }

    public Long getDoctorProfileId() {
        return doctorProfileId;
    }

    public void setDoctorProfileId(Long doctorProfileId) {
        this.doctorProfileId = doctorProfileId;
    }

    public Long getAdminProfileId() {
        return adminProfileId;
    }

    public void setAdminProfileId(Long adminProfileId) {
        this.adminProfileId = adminProfileId;
    }

    public Long getStaffClinicId() {
        return staffClinicId;
    }

    public void setStaffClinicId(Long staffClinicId) {
        this.staffClinicId = staffClinicId;
    }

    public Long getDoctorClinicId() {
        return doctorClinicId;
    }

    public void setDoctorClinicId(Long doctorClinicId) {
        this.doctorClinicId = doctorClinicId;
    }

    public String getSpeciality() {
        return speciality;
    }

    public void setSpeciality(String speciality) {
        this.speciality = speciality;
    }
}
