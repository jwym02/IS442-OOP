package com.clinic.domain.user;

import com.clinic.domain.medical.MedicalRecord;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Patient extends User {
    private Long patientProfileId;
    private final List<MedicalRecord> medicalRecords = new ArrayList<>();

    public Patient() {
    }

    public Patient(Long patientProfileId) {
        this.patientProfileId = patientProfileId;
    }

    public Long getPatientProfileId() {
        return patientProfileId;
    }

    public void setPatientProfileId(Long patientProfileId) {
        this.patientProfileId = patientProfileId;
    }

    public List<MedicalRecord> getMedicalRecords() {
        return Collections.unmodifiableList(medicalRecords);
    }

    public void addMedicalRecord(MedicalRecord record) {
        if (record != null) {
            medicalRecords.add(record);
        }
    }
}
