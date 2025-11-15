package com.clinic.domain.stats;

import java.time.LocalDateTime;
import java.util.Map;

public class SystemStats {
    private int totalAppointments;
    private int cancellations;
    private int completedAppointments;
    private int totalUsers;
    private int activeClinics;
    private Map<String, Integer> queueStatistics;
    private LocalDateTime reportGeneratedAt;

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
    public Map<String, Integer> getQueueStatistics() { return queueStatistics; }
    public void setQueueStatistics(Map<String, Integer> queueStatistics) { this.queueStatistics = queueStatistics; }
    public LocalDateTime getReportGeneratedAt() { return reportGeneratedAt; }
    public void setReportGeneratedAt(LocalDateTime reportGeneratedAt) { this.reportGeneratedAt = reportGeneratedAt; }

    public String getQueueSummary() { return queueStatistics != null ? queueStatistics.toString() : ""; }
    @Override public String toString() { return "SystemStats{" + totalAppointments + ", completed=" + completedAppointments + '}'; }
}
