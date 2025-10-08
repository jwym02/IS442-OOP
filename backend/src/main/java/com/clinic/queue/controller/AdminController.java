package com.clinic.queue.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.clinic.queue.service.AdminService;

@RestController
@RequestMapping("/api/admins")
@CrossOrigin(origins = "http://localhost:5173") // your frontend port
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /** GET all users from Supabase */
    @GetMapping
    public ResponseEntity<String> getAllUsers() {
        try {
            String result = adminService.getAllUsers();
            System.out.println("Fetched users from Supabase: " + result);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("Failed to fetch users: " + e.getMessage());
        }
    }
}
