package com.clinic.infrastructure.persistence;

import com.clinic.domain.entity.QueueSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface QueueSessionRepository extends JpaRepository<QueueSession, Long> {
    Optional<QueueSession> findByClinicIdAndQueueDate(Long clinicId, LocalDate queueDate);
}
