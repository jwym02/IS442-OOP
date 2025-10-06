package com.clinic.queue.service;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController            
@RequestMapping("/supabase")
@CrossOrigin(origins = "*")
public class AppointmentService {
    private static final String TABLE = "appointments";
    private static final String ID_COL = "appointmentId";

    private final SupabaseService supabase;

    public AppointmentService(SupabaseService supabase) {
        this.supabase = supabase;
    }

    // public String cancelAppointment(long appointmentId) {
    //     // Return the updated row(s) as JSON
    //     return supabase.patchById(
    //         TABLE, ID_COL, appointmentId,
    //         Map.of("status", "CANCELLED")  // make sure this matches your enum/text
    //     );
    // }

    @PatchMapping("/appointments/{id}")
    public ResponseEntity<String> patchAppointment(@PathVariable("id") long id,
                                                   @RequestBody Map<String, Object> update) {
        // use the correct PK column name
        String response = supabase.patchById(TABLE, ID_COL, id, update);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/appointments/{id}/status/{new_status}")
    public ResponseEntity<String> updateAppointmentStatus(@PathVariable("id") long id, @PathVariable("new_status") String newStatus) {
        String json = supabase.patchById(
            "appointments",       // table
            "appointmentId",      // PK column
            id,                   // row id
            "status",             // column to update
            newStatus             // value
        );
        return ResponseEntity.ok(json);
    }
}
