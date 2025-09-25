package com.clinic.queue.model;

public class QueueEntry {
    private int queueNumber;
    private QueueStatus status;

    public enum QueueStatus { WAITING, CHECKED_IN, NO_SHOW, COMPLETED }

    public int getQueueNumber() {
        return queueNumber;
    }

    public void setQueueNumber(int queueNumber) {
        this.queueNumber = queueNumber;
    }

    public QueueStatus getStatus() {
        return status;
    }

    public void setStatus(QueueStatus status) {
        this.status = status;
    }

    public void updateStatus(QueueStatus newStatus) {
        // TODO: implement
    }

    public void notifyPatient(String message) {
        // TODO: implement
    }

    public void fastTrack() {
        // TODO: implement
    }
}

