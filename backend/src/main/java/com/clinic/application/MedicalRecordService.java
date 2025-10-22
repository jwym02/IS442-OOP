package com.clinic.application;

import com.clinic.api.patients.dto.MedicalRecordResponse;
import com.clinic.domain.entity.Appointment;
import com.clinic.domain.entity.MedicalRecordEntity;
import com.clinic.infrastructure.persistence.AppointmentRepository;
import com.clinic.infrastructure.persistence.ClinicRepository;
import com.clinic.infrastructure.persistence.DoctorProfileRepository;
import com.clinic.infrastructure.persistence.MedicalRecordRepository;
import com.clinic.infrastructure.persistence.PatientProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final ClinicRepository clinicRepository;

    public MedicalRecordService(MedicalRecordRepository medicalRecordRepository,
                                PatientProfileRepository patientProfileRepository,
                                AppointmentRepository appointmentRepository,
                                DoctorProfileRepository doctorProfileRepository,
                                ClinicRepository clinicRepository) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.clinicRepository = clinicRepository;
    }

    @Transactional
    public MedicalRecordEntity createOrUpdateNotes(Long doctorId, Long appointmentId, String notes) {
        if (appointmentId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "appointmentId is required");
        }
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));

        if (doctorId != null && !doctorId.equals(appointment.getDoctorId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor does not match appointment");
        }

        MedicalRecordEntity existing = medicalRecordRepository.findByAppointmentId(appointmentId).orElse(null);
        if (existing == null) {
            MedicalRecordEntity entity = new MedicalRecordEntity();
            entity.setAppointmentId(appointment.getId());
            entity.setPatientId(appointment.getPatientId());
            entity.setDoctorId(appointment.getDoctorId());
            entity.setNotes(notes);
            return medicalRecordRepository.save(entity);
        } else {
            existing.setNotes(notes);
            return medicalRecordRepository.save(existing);
        }
    }

    @Transactional
    public MedicalRecordEntity createFromAppointmentIfMissing(Appointment appointment) {
        if (appointment == null) return null;
        Long appointmentId = appointment.getId();
        return medicalRecordRepository.findByAppointmentId(appointmentId).orElseGet(() -> {
            MedicalRecordEntity entity = new MedicalRecordEntity();
            entity.setAppointmentId(appointment.getId());
            entity.setPatientId(appointment.getPatientId());
            entity.setDoctorId(appointment.getDoctorId());
            entity.setNotes(null);
            return medicalRecordRepository.save(entity);
        });
    }

    @Transactional(readOnly = true)
    public List<MedicalRecordResponse> getMedicalRecords(Long patientId) {
        patientProfileRepository.findById(patientId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found"));

        return medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MedicalRecordResponse getMedicalRecord(Long patientId, Long recordId) {
        patientProfileRepository.findById(patientId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found"));

        MedicalRecordEntity entity = medicalRecordRepository.findById(recordId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medical record not found"));

        if (!patientId.equals(entity.getPatientId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Medical record not found for this patient");
        }

        return toResponse(entity);
    }

    private MedicalRecordResponse toResponse(MedicalRecordEntity entity) {
        MedicalRecordResponse response = new MedicalRecordResponse();
        response.setId(entity.getId());
        response.setPatientId(entity.getPatientId());
    response.setAppointmentId(entity.getAppointmentId());
        response.setNotes(entity.getNotes());

        // doctor/clinic info: prefer appointment data when available
        Long doctorId = entity.getDoctorId();
        Long clinicId = null;
        if (entity.getAppointmentId() != null) {
            Appointment appt = appointmentRepository.findById(entity.getAppointmentId()).orElse(null);
            if (appt != null) {
                doctorId = appt.getDoctorId() != null ? appt.getDoctorId() : doctorId;
                clinicId = appt.getClinicId();
            }
        }
        response.setDoctorId(doctorId);
        if (doctorId != null) {
            doctorProfileRepository.findById(doctorId).ifPresent(d -> response.setDoctorName(d.getFullName()));
        }
        response.setClinicId(clinicId);
        if (clinicId != null) {
            clinicRepository.findById(clinicId).ifPresent(c -> response.setClinicName(c.getName()));
        }

        NotesParts notesParts = splitNotes(entity.getNotes());
        response.setDiagnosis(notesParts.diagnosis());
        response.setTreatment(notesParts.treatment());

        LocalDateTime recordDate = Optional.ofNullable(entity.getCreatedAt())
            .orElseGet(() -> resolveAppointmentDate(entity.getAppointmentId()));
        response.setRecordDate(recordDate);
        return response;
    }

    private NotesParts splitNotes(String notes) {
        if (notes == null || notes.isBlank()) {
            return new NotesParts("", "");
        }

        String diagnosis = "";
        String treatment = notes.trim();

        String normalised = notes.replace("\n", " ").trim();
        int rxIndex = normalised.toLowerCase().indexOf("rx:");
        int dxIndex = normalised.toLowerCase().indexOf("dx:");

        if (rxIndex >= 0) {
            treatment = normalised.substring(rxIndex + 3).trim();
            diagnosis = normalised.substring(0, rxIndex).trim();
        }

        if (dxIndex >= 0 && diagnosis.isBlank()) {
            diagnosis = normalised.substring(dxIndex + 3, rxIndex >= 0 ? rxIndex : normalised.length()).trim();
        }

        return new NotesParts(cleanPrefix(diagnosis, "dx:"), cleanPrefix(treatment, "rx:"));
    }

    private String cleanPrefix(String value, String prefix) {
        if (value == null) {
            return "";
        }
        String result = value.trim();
        if (result.toLowerCase().startsWith(prefix)) {
            result = result.substring(prefix.length()).trim();
        }
        return result;
    }

    private LocalDateTime resolveAppointmentDate(Long appointmentId) {
        if (appointmentId == null) {
            return null;
        }
        return appointmentRepository.findById(appointmentId)
            .map(Appointment::getDateTime)
            .orElse(null);
    }

    private record NotesParts(String diagnosis, String treatment) {}
}
