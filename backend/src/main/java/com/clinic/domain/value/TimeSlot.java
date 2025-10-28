package com.clinic.domain.value;

import com.clinic.domain.enums.SlotState;
import java.time.LocalDateTime;
import java.util.Objects;

public final class TimeSlot {
    private final LocalDateTime start;
    private final LocalDateTime end;
    private final SlotState state;

    public TimeSlot(LocalDateTime start, LocalDateTime end, SlotState state) {
        if (start == null || end == null || !end.isAfter(start)) {
            throw new IllegalArgumentException("Invalid time slot range");
        }
        this.start = start;
        this.end = end;
        this.state = state == null ? SlotState.FREE : state;
    }

    public LocalDateTime getStart() { return start; }
    public LocalDateTime getEnd() { return end; }
    public SlotState getState() { return state; }

    public TimeSlot withState(SlotState newState) { return new TimeSlot(this.start, this.end, newState); }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TimeSlot)) return false;
        TimeSlot that = (TimeSlot) o;
        return Objects.equals(start, that.start) && Objects.equals(end, that.end);
    }
    @Override public int hashCode() { return Objects.hash(start, end); }
    @Override public String toString() { return "TimeSlot{" + start + "->" + end + ", " + state + '}'; }
}
