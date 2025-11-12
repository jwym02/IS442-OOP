package com.clinic.api.staff;

import com.clinic.api.staff.dto.AppointmentRequest;
import com.clinic.api.staff.dto.AppointmentResponse;
import com.clinic.api.staff.dto.ClinicQueueStatusResponse;
import com.clinic.api.staff.dto.DailyReportResponse;
import com.clinic.api.staff.dto.QueueEntrySummaryResponse;
import com.clinic.api.staff.dto.QueueStatusUpdateRequest;
import com.clinic.api.staff.dto.RescheduleRequest;
import com.clinic.application.QueueService;
import com.clinic.application.StaffService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/staff")
@Tag(name = "Clinic Staff", description = "API for clinic staff operations")
public class StaffController {
    private final StaffService staffService;
    private final QueueService queueService;

    private static final Logger log = LoggerFactory.getLogger(StaffController.class);

    public StaffController(StaffService staffService, QueueService queueService) {
        this.staffService = staffService;
        this.queueService = queueService;
    }

    @PostMapping("/appointments/walk-in")
    public ResponseEntity<AppointmentResponse> walkIn(@RequestBody @Valid AppointmentRequest request) {
        return ResponseEntity.ok(staffService.bookWalkIn(request));
    }

    @PatchMapping("/staff/appointments/{appointmentId}/reschedule")
    public ResponseEntity<AppointmentResponse> reschedule(@PathVariable Long appointmentId,
                                                          @RequestBody @Valid RescheduleRequest request) {
        return ResponseEntity.ok(staffService.rescheduleAppointment(appointmentId, request));
    }

    @DeleteMapping("/appointments/{appointmentId}")
    public ResponseEntity<Void> cancel(@PathVariable Long appointmentId) {
        staffService.cancelAppointmentAsStaff(appointmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponse>> getClinicAppointments(
            @RequestParam Long clinicId,
            @RequestParam(required = false) String date,
            @RequestParam(required = false, defaultValue = "all") String type) {

        if ("upcoming".equalsIgnoreCase(type)) {
            return ResponseEntity.ok(staffService.getUpcomingClinicAppointments(clinicId));
        }

        if (date != null && !date.isBlank()) {
            LocalDate targetDate = LocalDate.parse(date);
            return ResponseEntity.ok(staffService.getClinicAppointments(clinicId, targetDate));
        } else {
            return ResponseEntity.ok(staffService.getClinicAppointments(clinicId, null));
        }
    }


    @PostMapping("/queue/start")
    public ResponseEntity<Void> startQueue(@RequestParam Long clinicId) {
        queueService.start(clinicId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/queue/pause")
    public ResponseEntity<Void> pauseQueue(@RequestParam Long clinicId) {
        queueService.pause(clinicId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/queue/next")
    public ResponseEntity<AppointmentResponse> nextQueue(@RequestParam Long clinicId) {
        return ResponseEntity.ok(queueService.callNext(clinicId));
    }

    @PatchMapping("/queue/{queueNumber}/status")
    public ResponseEntity<Void> updateQueueStatus(@PathVariable Long queueNumber,
                                                  @RequestBody @Valid QueueStatusUpdateRequest request) {
        log.info("Request: updateQueueStatus queueNumber={} clinicId={} status={}",
                 queueNumber, request != null ? request.getClinicId() : null, request != null ? request.getStatus() : null);
        try {
            queueService.markStatus(request.getClinicId(), queueNumber, request.getStatus());
            return ResponseEntity.ok().build();
        } catch (ResponseStatusException rse) {
            // preserve expected HTTP responses thrown by service
            log.warn("Known error updating queue status: {}", rse.getReason(), rse);
            throw rse;
        } catch (Exception ex) {
            log.error("Unhandled error updating queue status for queueNumber={} clinicId={}",
                      queueNumber, request != null ? request.getClinicId() : null, ex);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to update queue status", ex);
        }
    }

    @PostMapping("/queue/{queueNumber}/fast-track")
    public ResponseEntity<Void> fastTrack(@PathVariable Long queueNumber, @RequestParam Long clinicId) {
        queueService.fastTrack(clinicId, queueNumber);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/queue/status")
    public ResponseEntity<ClinicQueueStatusResponse> getQueueStatus(@RequestParam Long clinicId) {
        return ResponseEntity.ok(queueService.getClinicStatus(clinicId));
    }

    @GetMapping("/queue/entries")
    public ResponseEntity<List<QueueEntrySummaryResponse>> listQueueEntries(@RequestParam Long clinicId) {
        return ResponseEntity.ok(queueService.listEntries(clinicId));
    }

    @GetMapping("/reports/daily")
    public ResponseEntity<DailyReportResponse> getDailyReport(@RequestParam Long clinicId,
                                                              @RequestParam(required = false) String date) {
        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        return ResponseEntity.ok(staffService.getDailyReport(clinicId, targetDate));
    }
}

