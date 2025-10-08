package com.clinic.queue.service;

import org.springframework.stereotype.Service;

import com.clinic.queue.repository.AdminRepository;

@Service
public class AdminService {
    private final AdminRepository adminRepository;

    public AdminService(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    /** Fetch all users via repository */
    public String getAllUsers() {
        return adminRepository.getAllUsers();
    }
}
