package com.clinic.queue.service;

import org.springframework.security.core.*;
import org.springframework.stereotype.Service;

import com.clinic.queue.repository.DoctorRepository;

@Service
public class DoctorService extends StaffService {
    
    private final DoctorRepository doctorRepository;

    public DoctorService(DoctorRepository doctorRepository) {
        super(doctorRepository);
        this.doctorRepository = doctorRepository;
    }
    
    // TODO: Implement doctor specific service from repo

}
