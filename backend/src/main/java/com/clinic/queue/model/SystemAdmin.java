package com.clinic.queue.model;

public class SystemAdmin extends User {

    public SystemAdmin(long userId, String name, String email, String contact, String rawPassword, long adminId) {
        super(userId, name, email, contact, rawPassword);
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
        System.out.println("Hello");
    }

    public void restoreData() {
    }

    // public SystemStats viewUsageStats() {
    //     return null;
    // }
    
}
