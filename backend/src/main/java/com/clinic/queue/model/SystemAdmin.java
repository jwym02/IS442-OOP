package com.clinic.queue.model;

import com.clinic.queue.config.DatabaseConfig;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class SystemAdmin extends User {

    public SystemAdmin(long userId, String name, String email, String contact, String rawPassword, long adminId) {
        super(userId, name, email, contact, rawPassword);
        this.adminId = adminId;
    }

    public long getAdminId() {
        return adminId;
    }

    public void setAdminId(long adminId) {
        this.adminId = adminId;
    }

    public boolean createUserAccount(User user) {
        
            return true;

    }

    public boolean updateUserAccount(String userId, User updatedUser) {
        return false;
    }

    public boolean deleteUserAccount(String userId) {
        return false;
    }

    public boolean assignRole(String userId, String role) {
        return false;
    }

    // public boolean configureClinic(Clinic clinic) {
    //     return false;
    // }

    public boolean configureDoctorSchedule(String doctorId, Schedule schedule) {
        return false;
    }

    public boolean setAppointmentSlotInterval(String clinicId, int intervalMinutes) {
        return false;
    }

    public boolean setOperatingHours(String clinicId, String operatingHours) {
        return false;
    }

    public void backupData() {
    }

    public void restoreData() {
    }

    // public SystemStats viewUsageStats() {
    //     return null;
    // }
    
}
