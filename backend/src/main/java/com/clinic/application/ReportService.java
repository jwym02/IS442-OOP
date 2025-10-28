package com.clinic.application;

import com.clinic.api.staff.dto.DailyReportResponse;
import com.clinic.domain.entity.Appointment;
import com.clinic.domain.entity.QueueEntry;
import com.clinic.domain.enums.AppointmentStatus;
import com.clinic.domain.enums.QueueStatus;
import com.clinic.domain.stats.SystemStats;
import com.clinic.infrastructure.persistence.AppointmentRepository;
import com.clinic.infrastructure.persistence.ClinicRepository;
import com.clinic.infrastructure.persistence.QueueEntryRepository;
import com.clinic.infrastructure.persistence.UserAccountRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final AppointmentRepository appointmentRepository;
    private final QueueEntryRepository queueEntryRepository;
    private final ClinicRepository clinicRepository;
    private final UserAccountRepository userAccountRepository;

    public ReportService(AppointmentRepository appointmentRepository,
                         QueueEntryRepository queueEntryRepository,
                         ClinicRepository clinicRepository,
                         UserAccountRepository userAccountRepository) {
        this.appointmentRepository = appointmentRepository;
        this.queueEntryRepository = queueEntryRepository;
        this.clinicRepository = clinicRepository;
        this.userAccountRepository = userAccountRepository;
    }

    public DailyReportResponse generateDailyClinicReport(Long clinicId, LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        LocalDateTime start = targetDate.atStartOfDay();
        LocalDateTime end = targetDate.plusDays(1).atStartOfDay();

        List<Appointment> appointments = appointmentRepository.findByClinicIdAndDateTimeBetween(clinicId, start, end);
        Map<AppointmentStatus, Long> appointmentStatusCounts = appointments.stream()
            .collect(Collectors.groupingBy(Appointment::getStatus, Collectors.counting()));

        List<QueueEntry> queueEntries = queueEntryRepository.findByClinicIdAndQueueDateOrderByQueueNumberAsc(clinicId, targetDate);
        Map<QueueStatus, Long> queueCounts = queueEntries.stream()
            .collect(Collectors.groupingBy(QueueEntry::getStatus, Collectors.counting()));

        DailyReportResponse response = new DailyReportResponse();
        response.setClinicId(clinicId);
        response.setReportDate(targetDate);
        response.setTotalAppointments(appointments.size());
        response.setCompletedAppointments(appointmentStatusCounts.getOrDefault(AppointmentStatus.COMPLETED, 0L).intValue());
        response.setCancelledAppointments(appointmentStatusCounts.getOrDefault(AppointmentStatus.CANCELLED, 0L).intValue());
        response.setNoShowAppointments(appointmentStatusCounts.getOrDefault(AppointmentStatus.NO_SHOW, 0L).intValue());
        response.setWalkInAppointments(appointmentStatusCounts.getOrDefault(AppointmentStatus.CHECKED_IN, 0L).intValue());
        response.setPatientsServed(queueCounts.getOrDefault(QueueStatus.SERVED, 0L).intValue());
        response.setPatientsWaiting(queueCounts.getOrDefault(QueueStatus.WAITING, 0L).intValue());
        response.setGeneratedAt(LocalDateTime.now());
        return response;
    }

    public SystemStats generateSystemUsageReport(LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        LocalDateTime start = targetDate.atStartOfDay();
        LocalDateTime end = targetDate.plusDays(1).atStartOfDay();

        List<Appointment> appointments = appointmentRepository.findByDateTimeBetween(start, end);
        Map<AppointmentStatus, Long> appointmentStatuses = appointments.stream()
            .collect(Collectors.groupingBy(Appointment::getStatus, Collectors.counting()));

        List<QueueEntry> queueEntries = queueEntryRepository.findByQueueDate(targetDate);
        Map<String, Integer> queueStatistics = queueEntries.stream()
            .collect(Collectors.groupingBy(entry -> entry.getStatus().name(),
                Collectors.reducing(0, e -> 1, Integer::sum)));

        SystemStats stats = new SystemStats();
        stats.setTotalAppointments(appointments.size());
        stats.setCancellations(appointmentStatuses.getOrDefault(AppointmentStatus.CANCELLED, 0L).intValue());
        stats.setCompletedAppointments(appointmentStatuses.getOrDefault(AppointmentStatus.COMPLETED, 0L).intValue());
        stats.setTotalUsers((int) userAccountRepository.count());
        stats.setActiveClinics((int) clinicRepository.count());
        stats.setQueueStatistics(queueStatistics);
        stats.setReportGeneratedAt(LocalDateTime.now());
        return stats;
    }
}
