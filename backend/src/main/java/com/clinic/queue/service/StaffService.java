package com.clinic.queue.service;

import org.springframework.security.core.*;
import org.springframework.stereotype.Service;

import com.clinic.queue.repository.StaffRepository;

@Service
public class StaffService {
    
    private final StaffRepository staffRepository;

    public StaffService(StaffRepository staffRepository) {
        this.staffRepository = staffRepository;
    }
    
}
