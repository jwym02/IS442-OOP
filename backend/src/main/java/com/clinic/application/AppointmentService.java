package com.clinic.application;

import com.clinic.api.patients.dto.AppointmentRequest;
import com.clinic.api.patients.dto.AppointmentResponse;
import com.clinic.domain.entity.Appointment;
import com.clinic.domain.enums.AppointmentStatus;
import com.clinic.infrastructure.persistence.AppointmentRepository;
import com.clinic.infrastructure.persistence.SpecialistRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AppointmentService {
    private final AppointmentRepository appointmentRepository;
    private final SpecialistRepository specialistRepository;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              SpecialistRepository specialistRepository) {
        this.appointmentRepository = appointmentRepository;
        this.specialistRepository = specialistRepository;
    }

    @Transactional
    public AppointmentResponse bookAppointment(Long patientId, AppointmentRequest req) {
        LocalDateTime appointmentTime = parseToLocalDateTime(req.getDateTime());
        
        // Validate that appointment is not in the past
        if (appointmentTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot book appointments in the past");
        }
        
        Appointment a = new Appointment();
        a.setPatientId(patientId);
        // If booking a specialist appointment, attach specialistId and leave clinicId null
        if (req.getSpecialistId() != null) {
            a.setSpecialistId(req.getSpecialistId());
            a.setClinicId(null);
        } else {
            a.setClinicId(req.getClinicId());
        }
        a.setDoctorId(req.getDoctorId());
        a.setDateTime(appointmentTime);
        a.setStatus(AppointmentStatus.SCHEDULED);
        // persist
        Appointment saved = appointmentRepository.save(a);
        return toResponse(saved);
    }

    @Transactional
    public AppointmentResponse rescheduleAppointment(Long appointmentId, AppointmentRequest req) {
        Optional<Appointment> opt = appointmentRepository.findById(appointmentId);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Appointment not found");
        }
        Appointment a = opt.get();
        if (req.getSpecialistId() != null) {
            a.setSpecialistId(req.getSpecialistId());
            a.setClinicId(null);
        } else {
            a.setClinicId(req.getClinicId());
            a.setSpecialistId(null);
        }
        a.setDoctorId(req.getDoctorId());
        a.setDateTime(parseToLocalDateTime(req.getDateTime()));
        Appointment updated = appointmentRepository.save(a);
        return toResponse(updated);
    }

    @Transactional
    public void cancelAppointment(Long appointmentId) {
        var opt = appointmentRepository.findById(appointmentId);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Appointment not found");
        }
        Appointment appointment = opt.get();
        // mark as cancelled and persist
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);
    }

    @Transactional
    public void cancelAppointmentAsStaff(Long appointmentId) {
        cancelAppointment(appointmentId);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getDoctorAppointments(Long doctorId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        return appointmentRepository.findAll().stream()
            .filter(a -> a.getDoctorId() != null && a.getDoctorId().equals(doctorId))
            .filter(a -> {
                LocalDateTime dt = a.getDateTime();
                return dt != null && (!dt.isBefore(start) && dt.isBefore(end));
            })
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getClinicAppointments(Long clinicId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        return appointmentRepository.findAll().stream()
            .filter(a -> a.getClinicId() != null && a.getClinicId().equals(clinicId))
            .filter(a -> {
                LocalDateTime dt = a.getDateTime();
                return dt != null && (!dt.isBefore(start) && dt.isBefore(end));
            })
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getUpcomingClinicAppointments(Long clinicId) {
        LocalDateTime now = LocalDateTime.now();
        return appointmentRepository.findAll().stream()
            .filter(a -> a.getClinicId() != null && a.getClinicId().equals(clinicId))
            .filter(a -> {
                LocalDateTime dt = a.getDateTime();
                return dt != null && dt.isAfter(now);
            })
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listForSpecialist(Long specialistId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        return appointmentRepository.findAll().stream()
            .filter(a -> a.getSpecialistId() != null && a.getSpecialistId().equals(specialistId))
            .filter(a -> {
                LocalDateTime dt = a.getDateTime();
                return dt != null && (!dt.isBefore(start) && dt.isBefore(end));
            })
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getPatientAppointments(Long patientId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : LocalDateTime.MIN;
        LocalDateTime end = endDate != null ? endDate.plusDays(1).atStartOfDay() : LocalDateTime.MAX;
        return appointmentRepository.findAll().stream()
            .filter(a -> a.getPatientId() != null && a.getPatientId().equals(patientId))
            .filter(a -> {
                LocalDateTime dt = a.getDateTime();
                return dt != null && (!dt.isBefore(start) && dt.isBefore(end));
            })
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * Return appointments for a clinic (no date filter).
     * Simple implementation that fetches all appointments and filters in-memory.
     * This avoids adding repository methods and is safe for the small dataset used by the app.
     */
    public List<AppointmentResponse> listForClinic(Long clinicId) {
        return appointmentRepository.findAll().stream()
                .filter(a -> Objects.equals(a.getClinicId(), clinicId))
                .sorted((a, b) -> a.getDateTime().compareTo(b.getDateTime()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Return appointments for a clinic on a specific date (YYYY-MM-DD).
     */
    public List<AppointmentResponse> listForClinicOnDate(Long clinicId, String date) {
        LocalDate d;
        try {
            d = LocalDate.parse(date);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Invalid date format, expected YYYY-MM-DD: " + date, ex);
        }
        LocalDate finalDate = d;
        return appointmentRepository.findAll().stream()
                .filter(a -> Objects.equals(a.getClinicId(), clinicId))
                .filter(a -> a.getDateTime() != null && a.getDateTime().toLocalDate().equals(finalDate))
                .sorted((a, b) -> a.getDateTime().compareTo(b.getDateTime()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // map entity -> DTO
    private AppointmentResponse toResponse(Appointment a) {
        AppointmentResponse r = new AppointmentResponse();
        r.setId(a.getId());
        r.setClinicId(a.getClinicId());
        r.setSpecialistId(a.getSpecialistId());
        r.setDoctorId(a.getDoctorId());
        r.setPatientId(a.getPatientId());
        // keep the LocalDateTime object (AppointmentResponse.dateTime is LocalDateTime)
        r.setDateTime(a.getDateTime());
        r.setStatus(a.getStatus() != null ? a.getStatus().name() : null);
        return r;
    }

    private LocalDateTime parseToLocalDateTime(Object value) {
        if (value == null) return null;
        String s = value.toString();
        try {
            // If string contains 'Z' or explicit offset, parse as OffsetDateTime then convert to system zone
            if (s.endsWith("Z") || s.matches(".*[+-]\\d{2}:?\\d{2}$")) {
                OffsetDateTime odt = OffsetDateTime.parse(s);
                return odt.atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
            }
            // otherwise treat as plain local datetime (YYYY-MM-DDTHH:mm:ss)
            return LocalDateTime.parse(s);
        } catch (DateTimeParseException e) {
            // fallback: try parsing OffsetDateTime more leniently
            try {
                OffsetDateTime odt = OffsetDateTime.parse(s);
                return odt.atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
            } catch (Exception ex) {
                throw new IllegalArgumentException("Invalid dateTime format: " + s, ex);
            }
        }
    }
}




