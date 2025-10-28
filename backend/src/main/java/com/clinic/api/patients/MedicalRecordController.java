package com.clinic.api.patients;

import com.clinic.api.patients.dto.MedicalRecordResponse;
import com.clinic.application.MedicalRecordService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/patients")
@Tag(name = "Medical Records", description = "API for patient medical records")
public class MedicalRecordController {
    private final MedicalRecordService medicalRecordService;

    public MedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    @GetMapping("/{patientId}/medical-records")
    public ResponseEntity<List<MedicalRecordResponse>> getMedicalRecords(@PathVariable Long patientId) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecords(patientId));
    }

    @GetMapping("/{patientId}/medical-records/{recordId}")
    public ResponseEntity<MedicalRecordResponse> getMedicalRecord(
            @PathVariable Long patientId,
            @PathVariable Long recordId) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecord(patientId, recordId));
    }
}
