package com.clinic.queue.repository;

import org.springframework.stereotype.Repository;

import com.clinic.queue.service.SupabaseService;

@Repository
public class StaffRepository {
    private static final String TABLE = "users";
    private final SupabaseService supabase;

    public StaffRepository(SupabaseService supabase) {
        this.supabase = supabase;
    }

    /** Fetch all rows from users table */
    public String getAllUsers() {
        return supabase.fetchData(TABLE);
    }


}
