package com.clinic.application;

import com.clinic.domain.entity.Clinic;
import com.clinic.domain.entity.Schedule;
import com.clinic.infrastructure.persistence.ClinicRepository;
import com.clinic.infrastructure.persistence.ScheduleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SchedulingService {
    private final ClinicRepository clinicRepository;
    private final ScheduleRepository scheduleRepository;

    public SchedulingService(ClinicRepository clinicRepository, ScheduleRepository scheduleRepository) {
        this.clinicRepository = clinicRepository;
        this.scheduleRepository = scheduleRepository;
    }

    @Transactional
    public Schedule generateSchedule(Long doctorId, Schedule template) {
        if (doctorId == null || template == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "doctorId and template are required");
        }
        int interval = template.getSlotIntervalMinutes();
        if (interval <= 0 || interval > 240) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "slotIntervalMinutes must be between 1 and 240");
        }
        Schedule sched = scheduleRepository.findByDoctorId(doctorId)
                .orElseGet(() -> {
                    Schedule s = new Schedule();
                    s.setDoctorId(doctorId);
                    return s;
                });
        sched.setSlotIntervalMinutes(interval);
        return scheduleRepository.save(sched);
    }

    @Transactional
    public void setAppointmentInterval(Long clinicId, int minutes) {
        if (clinicId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "clinicId is required");
        }
        if (minutes <= 0 || minutes > 240) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Interval must be between 1 and 240 minutes");
        }
        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinic not found"));
        clinic.setDefaultSlotIntervalMinutes(minutes);
        clinicRepository.save(clinic);
    }
}
