package com.clinic.domain.queue;

public class QueueSnapshot {
    private int waitingCount;
    private String activeTicket;
    private int estimatedWaitMinutes;

    public int getWaitingCount() { return waitingCount; }
    public void setWaitingCount(int waitingCount) { this.waitingCount = waitingCount; }
    public String getActiveTicket() { return activeTicket; }
    public void setActiveTicket(String activeTicket) { this.activeTicket = activeTicket; }
    public int getEstimatedWaitMinutes() { return estimatedWaitMinutes; }
    public void setEstimatedWaitMinutes(int estimatedWaitMinutes) { this.estimatedWaitMinutes = estimatedWaitMinutes; }
    public String asText() { return String.format("Now serving %s, %d waiting, ~%d minutes", activeTicket, waitingCount, estimatedWaitMinutes); }
}
