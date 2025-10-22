package com.clinic.api.doctors;

import com.clinic.api.doctors.dto.ScheduleResponse;
import com.clinic.api.doctors.dto.AppointmentResponse;
import com.clinic.application.DoctorService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/doctors")
@Tag(name = "Doctors", description = "API for doctor operations")
public class DoctorController {
    private final DoctorService doctorService;
    private final com.clinic.application.MedicalRecordService medicalRecordService;

    public DoctorController(DoctorService doctorService, com.clinic.application.MedicalRecordService medicalRecordService) {
        this.doctorService = doctorService;
        this.medicalRecordService = medicalRecordService;
    }

    @GetMapping("/{doctorId}/schedule")
    public ResponseEntity<ScheduleResponse> getSchedule(@PathVariable Long doctorId) {
        return ResponseEntity.ok(doctorService.getSchedule(doctorId));
    }

    @PutMapping("/{doctorId}/schedule")
    public ResponseEntity<Void> updateSchedule(@PathVariable Long doctorId, @RequestBody ScheduleResponse schedule) {
        doctorService.updateSchedule(doctorId, schedule);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{doctorId}/appointments")
    public ResponseEntity<List<AppointmentResponse>> getAppointments(@PathVariable Long doctorId, @RequestParam(required = false) String date) {
        return ResponseEntity.ok(doctorService.getAppointments(doctorId, date));
    }

    @PostMapping("/{doctorId}/appointments/notes")
    public ResponseEntity<Void> addNotes(@PathVariable Long doctorId, @RequestBody com.clinic.api.doctors.dto.AppointmentNotesRequest request) {
        // simple wiring - delegate to medicalRecordService
        medicalRecordService.createOrUpdateNotes(doctorId, request.getAppointmentId(), request.getNotes());
        return ResponseEntity.ok().build();
    }
}
