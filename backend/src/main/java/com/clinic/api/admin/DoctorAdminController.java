package com.clinic.api.admin;

import com.clinic.api.admin.dto.DoctorAdminResponse;
import com.clinic.application.DoctorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
public class DoctorAdminController {
    private final DoctorService doctorService;

    public DoctorAdminController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    // changed path to avoid collision with existing AdminController#listDoctors()
    @GetMapping("/doctors/all")
    public ResponseEntity<List<DoctorAdminResponse>> listAllDoctors() {
        return ResponseEntity.ok(doctorService.listAllAdminDoctors());
    }
}