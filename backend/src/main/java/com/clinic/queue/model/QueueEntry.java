package com.clinic.queue.model;

public class QueueEntry {
    private int queueNumber;
    private Status status;

    public enum Status { WAITING, CHECKED_IN, NO_SHOW, COMPLETED }

    public int getQueueNumber() {
        return queueNumber;
    }

    public void setQueueNumber(int queueNumber) {
        this.queueNumber = queueNumber;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public void updateStatus(String newStatus) {
        // TODO: implement
    }

    public void notifyPatient(String message) {
        // TODO: implement
    }

    public void fastTrack() {
        // TODO: implement
    }
}

