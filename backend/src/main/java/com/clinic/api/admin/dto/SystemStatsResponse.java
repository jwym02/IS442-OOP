package com.clinic.api.admin.dto;

import java.time.LocalDateTime;

public class SystemStatsResponse {
    private int totalAppointments;
    private int cancellations;
    private int completedAppointments;
    private int totalUsers;
    private int activeClinics;
    private String queueStatistics;
    private LocalDateTime reportGeneratedAt;

    // getters and setters
    public int getTotalAppointments() { return totalAppointments; }
    public void setTotalAppointments(int totalAppointments) { this.totalAppointments = totalAppointments; }
    public int getCancellations() { return cancellations; }
    public void setCancellations(int cancellations) { this.cancellations = cancellations; }
    public int getCompletedAppointments() { return completedAppointments; }
    public void setCompletedAppointments(int completedAppointments) { this.completedAppointments = completedAppointments; }
    public int getTotalUsers() { return totalUsers; }
    public void setTotalUsers(int totalUsers) { this.totalUsers = totalUsers; }
    public int getActiveClinics() { return activeClinics; }
    public void setActiveClinics(int activeClinics) { this.activeClinics = activeClinics; }
    public String getQueueStatistics() { return queueStatistics; }
    public void setQueueStatistics(String queueStatistics) { this.queueStatistics = queueStatistics; }
    public LocalDateTime getReportGeneratedAt() { return reportGeneratedAt; }
    public void setReportGeneratedAt(LocalDateTime reportGeneratedAt) { this.reportGeneratedAt = reportGeneratedAt; }
}
