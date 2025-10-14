package com.clinic.queue.repository;

import org.springframework.stereotype.Repository;

import com.clinic.queue.service.SupabaseService;

@Repository
public class DoctorRepository extends StaffRepository {

    public DoctorRepository(SupabaseService supabase) {
        super(supabase);
    }

    // TODO: Doctor specific CRUD

}
