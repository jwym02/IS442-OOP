package com.clinic.api.patients;

import com.clinic.api.patients.dto.AppointmentRequest;
import com.clinic.api.patients.dto.AppointmentResponse;
import com.clinic.application.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Appointments", description = "API for managing patient appointments")
public class AppointmentController {
    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping("/patients/{patientId}/appointments")
    @Operation(summary = "Book an appointment", description = "Book a new appointment for a patient with a doctor at a specific clinic")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Appointment booked successfully",
            content = @Content(schema = @Schema(implementation = AppointmentResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid input parameters"),
        @ApiResponse(responseCode = "404", description = "Patient, doctor, or clinic not found"),
        @ApiResponse(responseCode = "409", description = "Time slot already booked")
    })
    public ResponseEntity<AppointmentResponse> bookAppointment(
            @PathVariable long patientId,
            @RequestBody @Valid AppointmentRequest request) {
        return ResponseEntity.ok(appointmentService.bookAppointment(patientId, request));
    }

    @GetMapping("/patients/{patientId}/appointments")
    @Operation(summary = "List patient appointments", description = "Retrieve upcoming appointments for a patient")
    public ResponseEntity<List<AppointmentResponse>> listAppointments(
            @PathVariable Long patientId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : null;
        LocalDate end = endDate != null ? LocalDate.parse(endDate) : null;
        return ResponseEntity.ok(appointmentService.getPatientAppointments(patientId, start, end));
    }

    // DELETE /api/v1/appointments/{id}
    @DeleteMapping("/appointments/{id}")
    public ResponseEntity<Void> cancelAppointment(@PathVariable Long id) {
        appointmentService.cancelAppointment(id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/v1/clinics/{clinicId}/appointments?date=YYYY-MM-DD
    @GetMapping("/clinics/{clinicId}/appointments")
    @Operation(summary = "List appointments for a clinic")
    public List<AppointmentResponse> listForClinic(
        @PathVariable("clinicId") Long clinicId,
        @RequestParam(value = "date", required = false) String date) {
        if (date == null || date.isBlank()) {
            return appointmentService.listForClinic(clinicId);
        }
        return appointmentService.listForClinicOnDate(clinicId, date);
    }

    @PatchMapping("/appointments/{appointmentId}/reschedule")
    @Operation(summary = "Reschedule an appointment", description = "Reschedule an existing appointment")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Appointment rescheduled successfully",
            content = @Content(schema = @Schema(implementation = AppointmentResponse.class))),
        @ApiResponse(responseCode = "404", description = "Appointment not found")
    })
    public ResponseEntity<AppointmentResponse> rescheduleAppointment(
            @PathVariable long appointmentId,
            @RequestBody @Valid AppointmentRequest request) {
        return ResponseEntity.ok(appointmentService.rescheduleAppointment(appointmentId, request));
    }
}
