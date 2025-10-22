package com.clinic.domain.queue;

import com.clinic.domain.entity.QueueEntry;
import com.clinic.domain.entity.QueueSession;
import com.clinic.domain.enums.QueueState;
import com.clinic.domain.enums.QueueStatus;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

public class Queue {

    private final Long clinicId;
    private final LocalDate queueDate;
    private QueueState state;
    private final List<QueueEntry> entries;

    private Queue(Long clinicId, LocalDate queueDate, QueueState state, List<QueueEntry> entries) {
        this.clinicId = clinicId;
        this.queueDate = queueDate;
        this.state = state;
        this.entries = entries;
    }

    public static Queue createOrMerge(Long clinicId,
                                      LocalDate queueDate,
                                      QueueSession session,
                                      List<QueueEntry> entries) {
        QueueState state = session != null ? session.getState() : QueueState.ACTIVE;
        return new Queue(clinicId, queueDate, state, entries);
    }

    public QueueState getState() {
        return state;
    }

    public LocalDate getQueueDate() {
        return queueDate;
    }

    public Long getClinicId() {
        return clinicId;
    }

    public QueueEntry callNext() {
        return entries.stream()
            .filter(QueueEntry::isWaiting)
            .min(Comparator
                .comparingInt((QueueEntry entry) -> entry.getStatus() == QueueStatus.FAST_TRACKED ? 0 : 1)
                .thenComparingInt(QueueEntry::getQueueNumber))
            .map(entry -> {
                entry.updateStatus(QueueStatus.CALLED);
                return entry;
            })
            .orElse(null);
    }

    public void start() {
        state = QueueState.ACTIVE;
    }

    public void pause() {
        state = QueueState.PAUSED;
    }

    public boolean isActive() {
        return state == QueueState.ACTIVE;
    }

    public Optional<QueueEntry> findEntry(Integer queueNumber) {
        return entries.stream()
            .filter(entry -> entry.getQueueNumber().equals(queueNumber))
            .findFirst();
    }

    public QueueSnapshot snapshot() {
        QueueSnapshot snapshot = new QueueSnapshot();
        snapshot.setWaitingCount((int) entries.stream().filter(QueueEntry::isWaiting).count());
        entries.stream()
            .filter(entry -> entry.getStatus() == QueueStatus.CALLED)
            .max(Comparator.comparingInt(QueueEntry::getQueueNumber))
            .ifPresent(entry -> snapshot.setActiveTicket(String.valueOf(entry.getQueueNumber())));
        snapshot.setEstimatedWaitMinutes(snapshot.getWaitingCount() * 5);
        return snapshot;
    }
}
