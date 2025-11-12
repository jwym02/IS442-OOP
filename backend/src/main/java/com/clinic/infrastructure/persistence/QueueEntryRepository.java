package com.clinic.infrastructure.persistence;

import com.clinic.domain.entity.QueueEntry;
import com.clinic.domain.enums.QueueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface QueueEntryRepository extends JpaRepository<QueueEntry, Long> {

    List<QueueEntry> findByQueueDate(LocalDate date);
    Optional<QueueEntry> findByAppointmentId(Long appointmentId);

    // return 0 when no entries found
    @Query("select coalesce(max(q.queueNumber), 0) from QueueEntry q where q.clinicId = :clinicId and q.queueDate = :date")
    int findMaxQueueNumber(@Param("clinicId") Long clinicId, @Param("date") LocalDate date);

    // used by publishQueueSnapshot to get entries for a clinic on a specific date
    List<QueueEntry> findByClinicIdAndQueueDateAndStatusInOrderByQueueNumberAsc(Long clinicId, LocalDate queueDate, List<QueueStatus> statuses);

    List<QueueEntry> findByClinicIdAndQueueDateOrderByQueueNumberAsc(Long clinicId, LocalDate queueDate);
    Optional<QueueEntry> findByClinicIdAndQueueDateAndQueueNumber(Long clinicId, LocalDate queueDate, int queueNumber);
}
