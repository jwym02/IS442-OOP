package com.clinic.application;

import com.clinic.api.patients.dto.AppointmentRequest;
import com.clinic.api.staff.dto.AppointmentResponse;
import com.clinic.api.staff.dto.DailyReportResponse;
import com.clinic.api.staff.dto.RescheduleRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StaffService {

    private final AppointmentService appointmentService;
    private final ReportService reportService;

    public StaffService(AppointmentService appointmentService, ReportService reportService) {
        this.appointmentService = appointmentService;
        this.reportService = reportService;
    }

    @Transactional
    public AppointmentResponse bookWalkIn(com.clinic.api.staff.dto.AppointmentRequest request) {
        var createRequest = new AppointmentRequest();
        createRequest.setClinicId(request.getClinicId());
        createRequest.setDoctorId(request.getDoctorId());
        createRequest.setDateTime(request.getDateTime());
        var created = appointmentService.bookAppointment(request.getPatientId(), createRequest);
        return toStaffResponse(created);
    }

    @Transactional
    public AppointmentResponse rescheduleAppointment(Long appointmentId, RescheduleRequest request) {
        var update = new AppointmentRequest();
        update.setClinicId(request.getClinicId());
        update.setDoctorId(request.getDoctorId());
        update.setDateTime(request.getDateTime());
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
        response.setDateTime(source.getDateTime());
        response.setStatus(source.getStatus());
        return response;
    }
}
