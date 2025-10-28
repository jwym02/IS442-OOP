package com.clinic.api.auth.dto;

import java.util.List;
import java.util.UUID;

public class AuthResponse {
    private String token;
    private String refreshToken;
    private UUID userId;
    private String email;
    private List<String> roles;
    private Long patientProfileId;
    private Long staffProfileId;
    private Long doctorProfileId;
    private Long adminProfileId;
    private Long staffClinicId;
    private Long doctorClinicId;
    private String name;

    public AuthResponse() {
    }

    public AuthResponse(String token, String refreshToken) {
        this.token = token;
        this.refreshToken = refreshToken;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}

