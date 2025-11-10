package com.clinic.application;

import com.clinic.api.admin.dto.DoctorAdminResponse;
import com.clinic.api.doctors.dto.AppointmentResponse;
import com.clinic.api.doctors.dto.ScheduleResponse;
import com.clinic.domain.entity.Appointment;
import com.clinic.domain.entity.Clinic;
import com.clinic.domain.entity.DoctorProfile;
import com.clinic.domain.entity.Schedule;
import com.clinic.infrastructure.persistence.AppointmentRepository;
import com.clinic.infrastructure.persistence.ClinicRepository;
import com.clinic.infrastructure.persistence.DoctorProfileRepository;
import com.clinic.infrastructure.persistence.ScheduleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DoctorService {
    private final ScheduleRepository scheduleRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final ClinicRepository clinicRepository;
    private final AppointmentService appointmentService;
    private final AppointmentRepository appointmentRepository;

    public DoctorService(ScheduleRepository scheduleRepository,
                         DoctorProfileRepository doctorProfileRepository,
                         ClinicRepository clinicRepository,
                         AppointmentService appointmentService,
                         AppointmentRepository appointmentRepository) {
        this.scheduleRepository = scheduleRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.clinicRepository = clinicRepository;
        this.appointmentService = appointmentService;
        this.appointmentRepository = appointmentRepository;
    }

    @Transactional(readOnly = true)
    public ScheduleResponse getSchedule(Long doctorProfileId) {
        DoctorProfile doctor = doctorProfileRepository.findById(doctorProfileId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
        Schedule schedule = scheduleRepository.findByDoctorId(doctorProfileId).orElse(null);
        Clinic clinic = doctor.getClinicId() != null
            ? clinicRepository.findById(doctor.getClinicId()).orElse(null)
            : null;

        int interval = schedule != null ? schedule.getSlotIntervalMinutes()
            : clinic != null ? clinic.getDefaultSlotIntervalMinutes() : 15;
        LocalTime open = clinic != null && clinic.getOpenTime() != null ? clinic.getOpenTime() : LocalTime.of(9, 0);
        LocalTime close = clinic != null && clinic.getCloseTime() != null ? clinic.getCloseTime() : LocalTime.of(17, 0);

        LocalDate targetDay = LocalDate.now();
        List<LocalDateTime> occupiedSlots = appointmentRepository
            .findByDoctorIdAndDateTimeBetween(doctorProfileId, targetDay.atStartOfDay(), targetDay.plusDays(1).atStartOfDay())
            .stream()
            .map(Appointment::getDateTime)
            .collect(Collectors.toList());

        List<LocalDateTime> availableSlots = new ArrayList<>();
        LocalDateTime slot = targetDay.atTime(open);
        while (slot.isBefore(targetDay.atTime(close))) {
            if (!occupiedSlots.contains(slot)) {
                availableSlots.add(slot);
            }
            slot = slot.plusMinutes(interval);
        }

        ScheduleResponse response = new ScheduleResponse();
        response.setDoctorId(doctorProfileId);
        response.setSlotIntervalMinutes(interval);
        response.setAvailableSlots(availableSlots);
        return response;
    }

    @Transactional
    public void updateSchedule(Long doctorProfileId, ScheduleResponse scheduleRequest) {
        if (scheduleRequest.getSlotIntervalMinutes() == null || scheduleRequest.getSlotIntervalMinutes() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "slotIntervalMinutes must be positive");
        }
        scheduleRepository.save(scheduleRepository.findByDoctorId(doctorProfileId).map(existing -> {
            existing.setSlotIntervalMinutes(scheduleRequest.getSlotIntervalMinutes());
            return existing;
        }).orElseGet(() -> {
            Schedule schedule = new Schedule();
            schedule.setDoctorId(doctorProfileId);
            schedule.setSlotIntervalMinutes(scheduleRequest.getSlotIntervalMinutes());
            return schedule;
        }));
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointments(Long doctorProfileId, String date) {
        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        return appointmentService.getDoctorAppointments(doctorProfileId, targetDate).stream()
            .map(appt -> {
                AppointmentResponse response = new AppointmentResponse();
                response.setId(appt.getId());
                response.setPatientId(appt.getPatientId());
                response.setDoctorId(appt.getDoctorId());
                response.setClinicId(appt.getClinicId());
                response.setDateTime(appt.getDateTime());
                response.setStatus(appt.getStatus());
                return response;
            })
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DoctorAdminResponse> listAllAdminDoctors() {
        return doctorProfileRepository.findAll().stream()
            .map(this::toAdminResponse)
            .collect(Collectors.toList());
    }

    private DoctorAdminResponse toAdminResponse(DoctorProfile d) {
        // DoctorProfile uses the "specialty" column/name — call getSpecialty()
        return new DoctorAdminResponse(
            d.getId(),
            d.getFullName(),
            d.getSpecialty(),
            d.getClinicId(),
            d.getSpecialistId()
        );
    }
}
