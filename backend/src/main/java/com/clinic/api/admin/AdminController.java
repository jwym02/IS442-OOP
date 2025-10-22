package com.clinic.api.admin;

import com.clinic.api.admin.dto.AssignRoleRequest;
import com.clinic.api.admin.dto.ClinicRequest;
import com.clinic.api.admin.dto.ClinicResponse;
import com.clinic.api.admin.dto.DoctorAdminResponse;
import com.clinic.api.admin.dto.OperatingHoursRequest;
import com.clinic.api.admin.dto.ScheduleUpdateRequest;
import com.clinic.api.admin.dto.SlotIntervalRequest;
import com.clinic.api.admin.dto.SystemStatsResponse;
import com.clinic.api.admin.dto.UserRequest;
import com.clinic.api.admin.dto.UserResponse;
import com.clinic.application.AdminService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "System Administration", description = "API for system administration")
public class AdminController {
    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/users")
    public ResponseEntity<UserResponse> createUser(@RequestBody @Valid UserRequest request) {
        return ResponseEntity.status(201).body(adminService.createUser(request));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> listUsers() {
        return ResponseEntity.ok(adminService.listUsers());
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable UUID userId, @RequestBody @Valid UserRequest request) {
        return ResponseEntity.ok(adminService.updateUser(userId, request));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{userId}/roles")
    public ResponseEntity<UserResponse> assignRoles(@PathVariable UUID userId,
                                                    @RequestBody @Valid AssignRoleRequest request) {
        return ResponseEntity.ok(adminService.assignRoles(userId, request.getRole()));
    }

    @PutMapping("/clinics/{clinicId}")
    public ResponseEntity<ClinicResponse> updateClinic(@PathVariable Long clinicId,
                                                       @RequestBody @Valid ClinicRequest request) {
        return ResponseEntity.ok(adminService.updateClinic(clinicId, request));
    }

    @PutMapping("/doctors/{doctorId}/schedule")
    public ResponseEntity<Void> updateDoctorSchedule(@PathVariable Long doctorId,
                                                     @RequestBody @Valid ScheduleUpdateRequest schedule) {
        adminService.updateDoctorSchedule(doctorId, schedule);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/clinics/{clinicId}/slot-interval")
    public ResponseEntity<Void> updateSlotInterval(@PathVariable Long clinicId,
                                                   @RequestBody @Valid SlotIntervalRequest request) {
        adminService.updateSlotInterval(clinicId, request.getMinutes());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/clinics/{clinicId}/hours")
    public ResponseEntity<Void> updateClinicHours(@PathVariable Long clinicId,
                                                  @RequestBody @Valid OperatingHoursRequest operatingHours) {
        adminService.updateClinicHours(clinicId, operatingHours);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/maintenance/backup")
    public ResponseEntity<Void> backup() {
        adminService.backup();
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/maintenance/restore")
    public ResponseEntity<Void> restore() {
        adminService.restore();
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<SystemStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getSystemStats());
    }

    @GetMapping("/clinics")
    public ResponseEntity<List<ClinicResponse>> listClinics() {
        return ResponseEntity.ok(adminService.listClinics());
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorAdminResponse>> listDoctors() {
        return ResponseEntity.ok(adminService.listDoctors());
    }
}
