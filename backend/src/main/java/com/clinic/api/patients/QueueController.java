package com.clinic.api.patients;

import com.clinic.api.patients.dto.QueueEntryResponse;
import com.clinic.api.patients.dto.QueueStatusResponse;
import com.clinic.application.QueueService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/patients")
@Tag(name = "Queue", description = "API for patient queue operations")
public class QueueController {
    private final QueueService queueService;

    public QueueController(QueueService queueService) {
        this.queueService = queueService;
    }

    @PostMapping("/appointments/{appointmentId}/check-in")
    public ResponseEntity<QueueEntryResponse> checkIn(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(queueService.checkIn(appointmentId));
    }

    @GetMapping("/{patientId}/queue-status")
    public ResponseEntity<QueueStatusResponse> getQueueStatus(@PathVariable Long patientId) {
        return ResponseEntity.ok(queueService.getStatusForPatient(patientId));
    }
}
