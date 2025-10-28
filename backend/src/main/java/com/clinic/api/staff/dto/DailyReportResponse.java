package com.clinic.api.staff.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class DailyReportResponse {
    private Long clinicId;
    private LocalDate reportDate;
    private int totalAppointments;
    private int completedAppointments;
    private int cancelledAppointments;
    private int noShowAppointments;
    private int walkInAppointments;
    private int patientsServed;
    private int patientsWaiting;
    private LocalDateTime generatedAt;

    public Long getClinicId() {
        return clinicId;
    }

    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }

    public LocalDate getReportDate() {
        return reportDate;
    }

    public void setReportDate(LocalDate reportDate) {
        this.reportDate = reportDate;
    }

    public int getTotalAppointments() {
        return totalAppointments;
    }

    public void setTotalAppointments(int totalAppointments) {
        this.totalAppointments = totalAppointments;
    }

    public int getCompletedAppointments() {
        return completedAppointments;
    }

    public void setCompletedAppointments(int completedAppointments) {
        this.completedAppointments = completedAppointments;
    }

    public int getCancelledAppointments() {
        return cancelledAppointments;
    }

    public void setCancelledAppointments(int cancelledAppointments) {
        this.cancelledAppointments = cancelledAppointments;
    }

    public int getNoShowAppointments() {
        return noShowAppointments;
    }

    public void setNoShowAppointments(int noShowAppointments) {
        this.noShowAppointments = noShowAppointments;
    }

    public int getWalkInAppointments() {
        return walkInAppointments;
    }

    public void setWalkInAppointments(int walkInAppointments) {
        this.walkInAppointments = walkInAppointments;
    }

    public int getPatientsServed() {
        return patientsServed;
    }

    public void setPatientsServed(int patientsServed) {
        this.patientsServed = patientsServed;
    }

    public int getPatientsWaiting() {
        return patientsWaiting;
    }

    public void setPatientsWaiting(int patientsWaiting) {
        this.patientsWaiting = patientsWaiting;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
}
