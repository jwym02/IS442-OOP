package com.clinic.queue.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.clinic.queue.entity.Appointment;
import com.clinic.queue.repository.PatientRepository;

@Service
public class PatientService {
    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository){
        this.patientRepository = patientRepository;
    }

    public String getAllPatient() {
        return patientRepository.getAllPatient();
    }

    public Appointment bookAppointment (long doctorId, long clinicId, LocalDateTime DateTime){
        Appointment newBooking = ();
    }
}
