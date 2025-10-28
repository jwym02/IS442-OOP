package com.clinic.infrastructure.persistence;

import com.clinic.domain.entity.QueueEntry;
import com.clinic.domain.enums.QueueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface QueueEntryRepository extends JpaRepository<QueueEntry, Long> {
    List<QueueEntry> findByClinicIdAndQueueDateOrderByQueueNumberAsc(Long clinicId, LocalDate date);
    Optional<QueueEntry> findByClinicIdAndQueueDateAndQueueNumber(Long clinicId, LocalDate date, Integer queueNumber);
    long countByClinicIdAndQueueDateAndStatusIn(Long clinicId, LocalDate date, List<QueueStatus> statuses);
    List<QueueEntry> findByQueueDate(LocalDate date);
    Optional<QueueEntry> findByAppointmentId(Long appointmentId);

    @Query("select coalesce(max(q.queueNumber),0) from QueueEntry q where q.clinicId = :clinicId and q.queueDate = :date")
    int findMaxQueueNumber(Long clinicId, LocalDate date);
}
