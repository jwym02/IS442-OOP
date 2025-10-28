package com.clinic.infrastructure.persistence;

import com.clinic.domain.entity.ClinicStaffProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClinicStaffProfileRepository extends JpaRepository<ClinicStaffProfile, Long> {
    Optional<ClinicStaffProfile> findByUserId(UUID userId);
    List<ClinicStaffProfile> findByClinicId(Long clinicId);
}
