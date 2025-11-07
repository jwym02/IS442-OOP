package com.clinic.application;

import com.clinic.api.patients.dto.AppointmentRequest;
import com.clinic.api.patients.dto.AppointmentResponse;
import com.clinic.domain.entity.Appointment;
import com.clinic.domain.entity.Clinic;
import com.clinic.domain.entity.DoctorProfile;
import com.clinic.domain.entity.Schedule;
import com.clinic.domain.enums.AppointmentStatus;
import com.clinic.infrastructure.persistence.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ClinicRepository clinicRepository;
    private final ScheduleRepository scheduleRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              ClinicRepository clinicRepository,
                              ScheduleRepository scheduleRepository,
                              PatientProfileRepository patientProfileRepository,
                              DoctorProfileRepository doctorProfileRepository) {
        this.appointmentRepository = appointmentRepository;
        this.clinicRepository = clinicRepository;
        this.scheduleRepository = scheduleRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.doctorProfileRepository = doctorProfileRepository;
    }

    @Transactional
    public AppointmentResponse bookAppointment(long patientId, AppointmentRequest request) {
        patientProfileRepository.findById(patientId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found"));
        DoctorProfile doctorProfile = doctorProfileRepository.findById(request.getDoctorId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
        if (doctorProfile.getClinicId() != null && !doctorProfile.getClinicId().equals(request.getClinicId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor does not belong to selected clinic");
        }
        // Convert incoming OffsetDateTime to Instant, then to server LocalDateTime for storage/queries
        OffsetDateTime odt = request.getDateTime();
        Instant appointmentInstant = odt.toInstant();
        LocalDateTime appointmentLocal = LocalDateTime.ofInstant(appointmentInstant, ZoneId.systemDefault());

        validateClinicAndSlotRules(request.getClinicId(), doctorProfile.getId(), appointmentInstant, odt.getOffset());
        if (appointmentRepository.existsByDoctorIdAndDateTime(doctorProfile.getId(), appointmentLocal)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Time slot already booked for this doctor");
        }

        Appointment appointment = new Appointment();
        appointment.setPatientId(patientId);
        appointment.setDoctorId(doctorProfile.getId());
        appointment.setClinicId(request.getClinicId());
        appointment.setDateTime(appointmentLocal);
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        appointment = appointmentRepository.save(appointment);
        return toResponse(appointment);
    }

    @Transactional
    public void cancelAppointment(long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));
        if (!canModify(appointment.getDateTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot cancel within 24 hours of appointment time");
        }
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);
    }

    @Transactional
public AppointmentResponse rescheduleAppointment(long appointmentId, AppointmentRequest request) {
    Appointment appointment = appointmentRepository.findById(appointmentId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));

    if (!canModify(appointment.getDateTime())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot reschedule within 24 hours of appointment time");
    }

    DoctorProfile doctorProfile = doctorProfileRepository.findById(request.getDoctorId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));

    if (doctorProfile.getClinicId() != null && !doctorProfile.getClinicId().equals(request.getClinicId())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor does not belong to selected clinic");
    }
    var odt = request.getDateTime();
    var appointmentInstant = odt.toInstant();
    var appointmentLocal = LocalDateTime.ofInstant(appointmentInstant, ZoneId.systemDefault());

    validateClinicAndSlotRules(request.getClinicId(), doctorProfile.getId(), appointmentInstant, odt.getOffset());

    if (appointmentRepository.existsByDoctorIdAndDateTimeAndIdNot(doctorProfile.getId(), appointmentLocal, appointment.getId())) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "New time slot already booked for this doctor");
    }

    appointment.setDoctorId(doctorProfile.getId());
    appointment.setClinicId(request.getClinicId());
    appointment.setDateTime(appointmentLocal);
    appointment.setStatus(AppointmentStatus.SCHEDULED);

    appointment = appointmentRepository.save(appointment);
    return toResponse(appointment);
}


    @Transactional(readOnly = true)
    public List<AppointmentResponse> getPatientAppointments(Long patientId, LocalDate startDate, LocalDate endDate) {
        patientProfileRepository.findById(patientId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found"));
        LocalDateTime start = (startDate != null ? startDate : LocalDate.now()).atStartOfDay();
        LocalDateTime end = (endDate != null ? endDate.plusDays(1) : LocalDate.now().plusMonths(1)).atStartOfDay();
        return appointmentRepository.findByPatientIdAndDateTimeBetween(patientId, start, end)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getUpcomingClinicAppointments(Long clinicId) {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime farFuture = LocalDateTime.now().plusYears(5);

        return appointmentRepository.findByClinicIdAndDateTimeBetween(clinicId, startOfToday, farFuture)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getClinicAppointments(Long clinicId) {
        return appointmentRepository.findByClinicId(clinicId)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getClinicAppointments(Long clinicId, LocalDate date) {
        LocalDate target = date != null ? date : LocalDate.now();
        LocalDateTime start = target.atStartOfDay();
        LocalDateTime end = target.plusDays(1).atStartOfDay();
        return appointmentRepository.findByClinicIdAndDateTimeBetween(clinicId, start, end)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getDoctorAppointments(Long doctorProfileId, LocalDate date) {
        LocalDate target = date != null ? date : LocalDate.now();
        LocalDateTime start = target.atStartOfDay();
        LocalDateTime end = target.plusDays(1).atStartOfDay();
        return appointmentRepository.findByDoctorIdAndDateTimeBetween(doctorProfileId, start, end)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    private boolean canModify(LocalDateTime appointmentTime) {
        // preserve behavior for existing LocalDateTime from DB
        return Duration.between(LocalDateTime.now(), appointmentTime).toHours() >= 24;
    }

    /**
     * appointmentInstant: instant of appointment (from client OffsetDateTime)
     * clientOffset: the offset provided by client (used only if needed)
     */
    private void validateClinicAndSlotRules(long clinicId, long doctorId, Instant appointmentInstant, java.time.ZoneOffset clientOffset) {
        if (appointmentInstant == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Appointment dateTime is required");
        }
        Clinic clinic = clinicRepository.findById(clinicId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinic not found"));
        // Compare instants in UTC
        Instant now = Instant.now();
        if (appointmentInstant.isBefore(now)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot book an appointment in the past");
        }

        // Convert appointment instant to the clinic/local zone (system default used here)
        ZoneId zone = ZoneId.systemDefault();
        ZonedDateTime zdt = ZonedDateTime.ofInstant(appointmentInstant, zone);

        LocalTime open = clinic.getOpenTime();
        LocalTime close = clinic.getCloseTime();
        if (open != null && close != null) {
            LocalTime time = zdt.toLocalTime().truncatedTo(ChronoUnit.MINUTES);
            if (time.isBefore(open) || !time.isBefore(close)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Appointment time is outside clinic operating hours");
            }
        }

        int interval = clinic.getDefaultSlotIntervalMinutes() > 0 ? clinic.getDefaultSlotIntervalMinutes() : 15;
        interval = scheduleRepository.findByDoctorId(doctorId)
            .map(Schedule::getSlotIntervalMinutes)
            .filter(minutes -> minutes != null && minutes > 0)
            .orElse(interval);

        if (zdt.getSecond() != 0 || zdt.getNano() != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Appointment time must align to minute boundaries");
        }
        int minutes = zdt.getMinute();
        if (minutes % interval != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Appointment time must align to " + interval + "-minute slots");
        }
    }

    private AppointmentResponse toResponse(Appointment appointment) {
        AppointmentResponse response = new AppointmentResponse();
        response.setId(appointment.getId());
        response.setPatientId(appointment.getPatientId());
        response.setDoctorId(appointment.getDoctorId());
        response.setClinicId(appointment.getClinicId());
        response.setDateTime(appointment.getDateTime());
        response.setStatus(appointment.getStatus().name());
        return response;
    }
}




