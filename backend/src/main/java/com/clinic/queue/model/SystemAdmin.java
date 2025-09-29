package com.clinic.queue.model;

public class SystemAdmin extends User {

    public SystemAdmin(long userId, String name, String email, String contact, char[] passwordHash) {
        super(userId, name, email, contact, passwordHash);
    }

    public boolean createUserAccount(User user) {
        // TODO: implement
        return true;
    }

    public boolean updateUserAccount(long userId, User updatedUser) {
        // TODO: implement
        return false;
    }

    public boolean deleteUserAccount(long userId) {
        // TODO: implement
        return false;
    }

    public boolean assignRole(long userId, String role) {
        // TODO: implement
        return false;
    }

    // public boolean configureClinic(Clinic clinic) {
    //     return false;
    // }

    public boolean configureDoctorSchedule(long doctorId, Schedule schedule) {
        // TODO: implement
        return false;
    }

    public boolean setAppointmentSlotInterval(long clinicId, int intervalMinutes) {
        // TODO: implement
        return false;
    }

    public boolean setOperatingHours(long clinicId, String operatingHours) {
        // TODO: implement
        return false;
    }

    public void backupData() {
        // TODO: implement
    }

    public void restoreData() {
        // TODO: implement
    }

    public SystemStats viewUsageStats() {
        // TODO: implement
        return null;
    }
    
}
