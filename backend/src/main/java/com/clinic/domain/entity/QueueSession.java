package com.clinic.domain.entity;

import com.clinic.domain.enums.QueueState;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "queue_sessions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"clinic_id", "queue_date"})
})
public class QueueSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clinic_id", nullable = false)
    private Long clinicId;

    @Column(name = "queue_date", nullable = false)
    private LocalDate queueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false)
    private QueueState state; // ACTIVE or PAUSED

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getClinicId() { return clinicId; }
    public void setClinicId(Long clinicId) { this.clinicId = clinicId; }
    public LocalDate getQueueDate() { return queueDate; }
    public void setQueueDate(LocalDate queueDate) { this.queueDate = queueDate; }
    public QueueState getState() { return state; }
    public void setState(QueueState state) { this.state = state; }

    public void start() {
        this.state = QueueState.ACTIVE;
    }

    public void pause() {
        this.state = QueueState.PAUSED;
    }
}
