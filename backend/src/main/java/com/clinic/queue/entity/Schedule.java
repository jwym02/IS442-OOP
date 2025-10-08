package com.clinic.queue.entity;

import java.time.LocalDateTime;
import java.util.List;

public class Schedule {
    private long scheduleId;
    private List<LocalDateTime> availableSlots;

    public long getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(long scheduleId) {
        this.scheduleId = scheduleId;
    }

    public List<LocalDateTime> getAvailableSlots() {
        return availableSlots;
    }

    public void setAvailableSlots(List<LocalDateTime> availableSlots) {
        this.availableSlots = availableSlots;
    }

    public void addSlot(LocalDateTime slot) {
        // TODO: implement
    }

    public void removeSlot(LocalDateTime slot) {
        // TODO: implement
    }

    public boolean checkAvailability(LocalDateTime slot) {
        // TODO: implement
        return false;
    }
}
