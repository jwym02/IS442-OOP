package com.clinic.api.common;

import com.clinic.api.patients.dto.AppointmentResponse;
import com.clinic.application.AppointmentService;
import com.clinic.application.SpecialistService;
import com.clinic.api.common.dto.SpecialistResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class SpecialistController {
    private final AppointmentService appointmentService;
    private final SpecialistService specialistService;

    public SpecialistController(AppointmentService appointmentService, SpecialistService specialistService) {
        this.appointmentService = appointmentService;
        this.specialistService = specialistService;
    }

    @GetMapping("/specialists")
    public ResponseEntity<List<SpecialistResponse>> listAllSpecialists() {
        return ResponseEntity.ok(specialistService.listAll());
    }

    @GetMapping("/specialists/{id}/appointments")
    public ResponseEntity<List<AppointmentResponse>> listAppointmentsForSpecialist(
        @PathVariable Long id,
        @RequestParam("date") String dateStr
    ) {
        LocalDate date = LocalDate.parse(dateStr);
        return ResponseEntity.ok(appointmentService.listForSpecialist(id, date));
    }
}
