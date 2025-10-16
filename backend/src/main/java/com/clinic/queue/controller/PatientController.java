package com.clinic.queue.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


import com.clinic.queue.service.PatientService;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "http://localhost:5173") // your frontend port
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    /** GET all patients from Supabase */
    @GetMapping
    public ResponseEntity<String> getAllPatient() {
        try {
            String result = patientService.getAllPatient();
            System.out.println("Fetched patients from Supabase: " + result);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.out.println("Failed to fetch data");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("Failed to fetch patients: " + e.getMessage());
        }
    }
}
