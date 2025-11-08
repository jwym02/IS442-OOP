package com.clinic.infrastructure.persistence;

import com.clinic.domain.entity.Appointment;
import com.clinic.domain.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    boolean existsByDoctorIdAndDateTime(Long doctorId, LocalDateTime dateTime);
    boolean existsByDoctorIdAndDateTimeAndIdNot(Long doctorId, LocalDateTime dateTime, Long id);
    List<Appointment> findByClinicId(Long clinicId);
    List<Appointment> findByClinicIdAndDateTimeBetween(Long clinicId, LocalDateTime start, LocalDateTime end);
    List<Appointment> findByPatientIdAndDateTimeBetween(Long patientId, LocalDateTime start, LocalDateTime end);
    List<Appointment> findByDoctorIdAndDateTimeBetween(Long doctorId, LocalDateTime start, LocalDateTime end);
    List<Appointment> findByDateTimeBetween(LocalDateTime start, LocalDateTime end);
    long countByStatus(AppointmentStatus status);
}
