package com.clinic.domain.entity;

import com.clinic.domain.enums.QueueStatus;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "queue_entries")
public class QueueEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clinic_id", nullable = false)
    private Long clinicId;

    @Column(name = "queue_date", nullable = false)
    private LocalDate queueDate;

    @Column(name = "queue_number", nullable = false)
    private Integer queueNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private QueueStatus status;

    @Column(name = "appointment_id")
    private Long appointmentId;

    public void updateStatus(QueueStatus newStatus) {
        this.status = newStatus;
    }

    public void fastTrack() {
        this.status = QueueStatus.FAST_TRACKED;
    }

    public boolean isWaiting() {
        return status == QueueStatus.WAITING || status == QueueStatus.FAST_TRACKED;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getClinicId() { return clinicId; }
    public void setClinicId(Long clinicId) { this.clinicId = clinicId; }
    public LocalDate getQueueDate() { return queueDate; }
    public void setQueueDate(LocalDate queueDate) { this.queueDate = queueDate; }
    public Integer getQueueNumber() { return queueNumber; }
    public void setQueueNumber(Integer queueNumber) { this.queueNumber = queueNumber; }
    public QueueStatus getStatus() { return status; }
    public void setStatus(QueueStatus status) { this.status = status; }
    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }
}
