package com.clinic.application;

import com.clinic.api.patients.dto.AppointmentRequest;
import com.clinic.api.staff.dto.AppointmentResponse;
import com.clinic.api.staff.dto.DailyReportResponse;
import com.clinic.api.staff.dto.RescheduleRequest;
import com.clinic.infrastructure.persistence.DoctorProfileRepository;
import com.clinic.infrastructure.persistence.PatientProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StaffService {

    private final AppointmentService appointmentService;
    private final ReportService reportService;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    public StaffService(AppointmentService appointmentService, 
                       ReportService reportService,
                       PatientProfileRepository patientProfileRepository,
                       DoctorProfileRepository doctorProfileRepository) {
        this.appointmentService = appointmentService;
        this.reportService = reportService;
        this.patientProfileRepository = patientProfileRepository;
        this.doctorProfileRepository = doctorProfileRepository;
    }

    @Transactional
    public AppointmentResponse bookWalkIn(com.clinic.api.staff.dto.AppointmentRequest request) {
        var createRequest = new AppointmentRequest();
        createRequest.setClinicId(request.getClinicId());
        createRequest.setDoctorId(request.getDoctorId());
        // staff request.getDateTime() may be OffsetDateTime -> convert to String for patient AppointmentRequest
        createRequest.setDateTime(request.getDateTime() != null ? request.getDateTime().toString() : null);
        var created = appointmentService.bookAppointment(request.getPatientId(), createRequest);
        return toStaffResponse(created);
    }

    @Transactional
    public AppointmentResponse rescheduleAppointment(Long appointmentId, RescheduleRequest request) {
        var update = new AppointmentRequest();
        update.setClinicId(request.getClinicId());
        update.setDoctorId(request.getDoctorId());
        // convert OffsetDateTime -> String for AppointmentRequest
        update.setDateTime(request.getDateTime() != null ? request.getDateTime().toString() : null);
        var updated = appointmentService.rescheduleAppointment(appointmentId, update);
        return toStaffResponse(updated);
    }

    @Transactional
    public void cancelAppointmentAsStaff(Long appointmentId) {
        appointmentService.cancelAppointmentAsStaff(appointmentId);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getClinicAppointments(Long clinicId, LocalDate date) {
        return appointmentService.getClinicAppointments(clinicId, date)
                .stream()
                .map(this::toStaffResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getUpcomingClinicAppointments(Long clinicId) {
        return appointmentService.getUpcomingClinicAppointments(clinicId)
                .stream()
                .map(this::toStaffResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DailyReportResponse getDailyReport(Long clinicId, LocalDate date) {
        return reportService.generateDailyClinicReport(clinicId, date);
    }

    private AppointmentResponse toStaffResponse(com.clinic.api.patients.dto.AppointmentResponse source) {
        var response = new AppointmentResponse();
        response.setId(source.getId());
        response.setPatientId(source.getPatientId());
        response.setDoctorId(source.getDoctorId());
        response.setClinicId(source.getClinicId());
        // patient source.getDateTime() is LocalDateTime -> pass it directly to staff DTO (matching its type)
        response.setDateTime(source.getDateTime());
        response.setStatus(source.getStatus());
        // Fetch and set patient name
        patientProfileRepository.findById(source.getPatientId())
            .ifPresent(patient -> response.setPatientName(patient.getFullName()));
        // Fetch and set doctor name
        if (source.getDoctorId() != null) {
            doctorProfileRepository.findById(source.getDoctorId())
                .ifPresent(doctor -> response.setDoctorName(doctor.getFullName()));
        }
        return response;
    }
}
