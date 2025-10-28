package com.clinic.infrastructure.persistence;

import com.clinic.domain.entity.MedicalRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecordEntity, Long> {
    List<MedicalRecordEntity> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    Optional<MedicalRecordEntity> findByAppointmentId(Long appointmentId);
}

