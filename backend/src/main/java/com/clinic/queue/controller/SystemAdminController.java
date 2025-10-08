package com.clinic.queue.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.clinic.queue.entity.SystemAdmin;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173") // change to your frontend port
public class SystemAdminController {

    private final SystemAdmin admin = new SystemAdmin(1L, "Admin", "admin@example.com", "12345678", "password");

    @PostMapping("/backup")
    public ResponseEntity<String> backupData() {
        try {
            admin.backupData();
            return ResponseEntity.ok("Backup completed successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Backup failed: " + e.getMessage());
        }
    }

    // @PostMapping("/restore")
    // public ResponseEntity<String> restoreData() {
    //     try {
    //         admin.restoreData();
    //         return ResponseEntity.ok("Restore completed successfully");
    //     } catch (Exception e) {
    //         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
    //                 .body("Restore failed: " + e.getMessage());
    //     }
    // }
}
