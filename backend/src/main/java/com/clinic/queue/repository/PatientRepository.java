package com.clinic.queue.repository;

import org.springframework.stereotype.Repository;

import com.clinic.queue.service.SupabaseService;

@Repository
public class PatientRepository {
    private static final String TABLE = "patient";
    private final SupabaseService supabase;

    public PatientRepository(SupabaseService supabase) {
        this.supabase = supabase;
    }

    /** Fetch all rows from users table */
    public String getAllPatient() {
        return supabase.fetchData(TABLE);
    }
}
