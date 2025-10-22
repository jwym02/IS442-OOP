package com.clinic.domain.user;

public class Doctor extends User {
    private Long doctorProfileId;
    private String specialty;
    private Long clinicId;

    public Doctor() {
    }

    public Doctor(Long doctorProfileId, String specialty, Long clinicId) {
        this.doctorProfileId = doctorProfileId;
        this.specialty = specialty;
        this.clinicId = clinicId;
    }

    public Long getDoctorProfileId() {
        return doctorProfileId;
    }

    public void setDoctorProfileId(Long doctorProfileId) {
        this.doctorProfileId = doctorProfileId;
    }

    public String getSpecialty() {
        return specialty;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public Long getClinicId() {
        return clinicId;
    }

    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }
}
