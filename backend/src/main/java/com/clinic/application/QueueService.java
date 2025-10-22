package com.clinic.application;

import com.clinic.api.common.dto.NotificationRequest;
import com.clinic.api.patients.dto.QueueEntryResponse;
import com.clinic.api.patients.dto.QueueStatusResponse;
import com.clinic.api.staff.dto.AppointmentResponse;
import com.clinic.api.staff.dto.ClinicQueueStatusResponse;
import com.clinic.api.staff.dto.QueueEntrySummaryResponse;
import com.clinic.domain.entity.Appointment;
import com.clinic.domain.entity.QueueEntry;
import com.clinic.domain.entity.QueueSession;
import com.clinic.domain.enums.AppointmentStatus;
import com.clinic.domain.enums.NotificationType;
import com.clinic.domain.enums.QueueState;
import com.clinic.domain.enums.QueueStatus;
import com.clinic.domain.queue.Queue;
import com.clinic.infrastructure.persistence.AppointmentRepository;
import com.clinic.infrastructure.persistence.QueueEntryRepository;
import com.clinic.infrastructure.persistence.QueueSessionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class QueueService {

    private final AppointmentRepository appointmentRepository;
    private final QueueEntryRepository queueEntryRepository;
    private final QueueSessionRepository queueSessionRepository;
    private final NotificationService notificationService;
    private final MedicalRecordService medicalRecordService;

    public QueueService(AppointmentRepository appointmentRepository,
                        QueueEntryRepository queueEntryRepository,
                        QueueSessionRepository queueSessionRepository,
                        NotificationService notificationService,
                        MedicalRecordService medicalRecordService) {
        this.appointmentRepository = appointmentRepository;
        this.queueEntryRepository = queueEntryRepository;
        this.queueSessionRepository = queueSessionRepository;
        this.notificationService = notificationService;
        this.medicalRecordService = medicalRecordService;
    }

    @Transactional
    public QueueEntryResponse checkIn(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));

        LocalDate today = LocalDate.now();
        if (!appointment.getDateTime().toLocalDate().equals(today)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Check-in allowed only on appointment date");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED || appointment.getStatus() == AppointmentStatus.NO_SHOW) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot check in cancelled or no-show appointments");
        }

        QueueSession session = queueSessionRepository.findByClinicIdAndQueueDate(appointment.getClinicId(), today)
            .orElse(null);
        if (session != null && session.getState() == QueueState.PAUSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Queue is currently paused");
        }

        Optional<QueueEntry> existingEntry = queueEntryRepository.findByAppointmentId(appointmentId);
        QueueEntry entry = existingEntry.orElseGet(() -> {
            int nextNumber = queueEntryRepository.findMaxQueueNumber(appointment.getClinicId(), today) + 1;
            QueueEntry created = new QueueEntry();
            created.setClinicId(appointment.getClinicId());
            created.setQueueDate(today);
            created.setQueueNumber(nextNumber);
            created.setStatus(QueueStatus.WAITING);
            created.setAppointmentId(appointment.getId());
            return queueEntryRepository.save(created);
        });

        appointment.setStatus(AppointmentStatus.CHECKED_IN);
        appointmentRepository.save(appointment);

        return toPatientResponse(entry, appointment);
    }

    @Transactional(readOnly = true)
    public QueueStatusResponse getStatusForPatient(Long patientId) {
        LocalDate today = LocalDate.now();
        List<Appointment> appointments = appointmentRepository.findByPatientIdAndDateTimeBetween(
                patientId, today.atStartOfDay(), today.plusDays(1).atStartOfDay()
            );
        if (appointments.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No appointment today for patient");
        }

        // Only consider appointments that are checked-in — queue status should be tied to a checked-in appointment
        List<Appointment> checkedIn = appointments.stream()
            .filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN)
            .collect(Collectors.toList());

        if (checkedIn.isEmpty()) {
            // patient has no active checked-in appointment for today
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No active checked-in appointment for patient");
        }

        // From checked-in appointments, find the one with an associated queue entry (prefer priority statuses)
        Appointment appointment = null;
        QueueEntry myEntry = null;

        for (Appointment appt : checkedIn) {
            Optional<QueueEntry> maybe = queueEntryRepository.findByAppointmentId(appt.getId());
            if (maybe.isPresent()) {
                QueueEntry entry = maybe.get();
                if (myEntry == null) {
                    appointment = appt;
                    myEntry = entry;
                } else {
                    // prefer entries with waiting/fast-tracked/called
                    boolean preferred = entry.getStatus() == QueueStatus.WAITING
                        || entry.getStatus() == QueueStatus.FAST_TRACKED
                        || entry.getStatus() == QueueStatus.CALLED;
                    boolean currentlyPreferred = myEntry.getStatus() == QueueStatus.WAITING
                        || myEntry.getStatus() == QueueStatus.FAST_TRACKED
                        || myEntry.getStatus() == QueueStatus.CALLED;
                    if (preferred && !currentlyPreferred) {
                        appointment = appt;
                        myEntry = entry;
                    } else if (preferred == currentlyPreferred) {
                        if (entry.getQueueNumber() < myEntry.getQueueNumber()) {
                            appointment = appt;
                            myEntry = entry;
                        }
                    }
                }
            }
        }

        if (appointment == null || myEntry == null) {
            // No queue entry associated with checked-in appointments
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No active checked-in appointment with a queue entry for patient");
        }

        List<QueueEntry> entries = queueEntryRepository
            .findByClinicIdAndQueueDateOrderByQueueNumberAsc(appointment.getClinicId(), today);

        int currentNumber = entries.stream()
            .filter(entry -> EnumSet.of(QueueStatus.CALLED, QueueStatus.SERVED).contains(entry.getStatus()))
            .mapToInt(QueueEntry::getQueueNumber)
            .max()
            .orElse(0);

        QueueStatusResponse response = new QueueStatusResponse();
        response.setClinicId(appointment.getClinicId());
        response.setPatientId(patientId);
        response.setCurrentNumber(currentNumber);

        response.setQueueNumber(myEntry.getQueueNumber().longValue());
        response.setStatus(myEntry.getStatus().name());
        int numbersAway = Math.max(0, myEntry.getQueueNumber() - currentNumber - 1);
        response.setNumbersAway(numbersAway);

        queueSessionRepository.findByClinicIdAndQueueDate(appointment.getClinicId(), today)
            .ifPresent(session -> response.setState(session.getState().name()));
        return response;
    }

    @Transactional
    public void start(Long clinicId) {
        LocalDate today = LocalDate.now();
        QueueSession session = queueSessionRepository.findByClinicIdAndQueueDate(clinicId, today)
            .orElseGet(() -> {
                QueueSession created = new QueueSession();
                created.setClinicId(clinicId);
                created.setQueueDate(today);
                return created;
            });
        session.start();
        queueSessionRepository.save(session);
    }

    @Transactional
    public void pause(Long clinicId) {
        QueueSession session = queueSessionRepository.findByClinicIdAndQueueDate(clinicId, LocalDate.now())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Queue session not started"));
        session.pause();
        queueSessionRepository.save(session);
    }

    @Transactional
    public AppointmentResponse callNext(Long clinicId) {
        LocalDate today = LocalDate.now();
        QueueSession session = queueSessionRepository.findByClinicIdAndQueueDate(clinicId, today)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Queue not started"));

        if (session.getState() != QueueState.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Queue is paused");
        }

        List<QueueEntry> entries = queueEntryRepository.findByClinicIdAndQueueDateOrderByQueueNumberAsc(clinicId, today);
        Queue queue = Queue.createOrMerge(clinicId, today, session, entries);

        QueueEntry nextEntry = queue.callNext();
        if (nextEntry == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No patients in queue");
        }

        queueEntryRepository.save(nextEntry);
        notifyUpcomingPatients(clinicId, today, nextEntry.getQueueNumber());
        return buildQueueAdvanceResponse(nextEntry);
    }

    @Transactional
    public void markStatus(Long clinicId, Long queueNumber, String status) {
        if (!StringUtils.hasText(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
        }
        QueueStatus newStatus;
        try {
            newStatus = QueueStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown queue status: " + status, ex);
        }

        QueueEntry entry = queueEntryRepository.findByClinicIdAndQueueDateAndQueueNumber(
                clinicId, LocalDate.now(), queueNumber.intValue())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Queue entry not found"));
        entry.updateStatus(newStatus);
        queueEntryRepository.save(entry);

        if (entry.getAppointmentId() != null) {
            appointmentRepository.findById(entry.getAppointmentId()).ifPresent(appointment -> {
                switch (newStatus) {
                    case SERVED -> {
                        appointment.setStatus(AppointmentStatus.COMPLETED);
                        // create a medical record entry if none exists
                        medicalRecordService.createFromAppointmentIfMissing(appointment);
                    }
                    case CANCELLED -> appointment.setStatus(AppointmentStatus.CANCELLED);
                    case SKIPPED -> appointment.setStatus(AppointmentStatus.NO_SHOW);
                    default -> { }
                }
                appointmentRepository.save(appointment);
            });
        }
    }

    @Transactional
    public void fastTrack(Long clinicId, Long queueNumber) {
        QueueEntry entry = queueEntryRepository.findByClinicIdAndQueueDateAndQueueNumber(
                clinicId, LocalDate.now(), queueNumber.intValue())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Queue entry not found"));
        entry.fastTrack();
        queueEntryRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public ClinicQueueStatusResponse getClinicStatus(Long clinicId) {
        LocalDate today = LocalDate.now();
        List<QueueEntry> entries = queueEntryRepository.findByClinicIdAndQueueDateOrderByQueueNumberAsc(clinicId, today);
        int current = entries.stream()
            .filter(entry -> EnumSet.of(QueueStatus.CALLED, QueueStatus.SERVED).contains(entry.getStatus()))
            .mapToInt(QueueEntry::getQueueNumber)
            .max()
            .orElse(0);
        long waiting = entries.stream()
            .filter(QueueEntry::isWaiting)
            .count();

        ClinicQueueStatusResponse response = new ClinicQueueStatusResponse();
        response.setClinicId(clinicId);
        response.setCurrentNumber(current);
        response.setWaitingCount((int) waiting);
        queueSessionRepository.findByClinicIdAndQueueDate(clinicId, today)
            .ifPresent(session -> response.setState(session.getState().name()));
        return response;
    }

    @Transactional(readOnly = true)
    public List<QueueEntrySummaryResponse> listEntries(Long clinicId) {
        LocalDate today = LocalDate.now();
        List<QueueEntry> entries = queueEntryRepository.findByClinicIdAndQueueDateOrderByQueueNumberAsc(clinicId, today);
        Map<Long, Appointment> appointments = appointmentRepository
            .findAllById(entries.stream()
                .map(QueueEntry::getAppointmentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet()))
            .stream()
            .collect(Collectors.toMap(Appointment::getId, appointment -> appointment));

        return entries.stream()
            .map(entry -> {
                QueueEntrySummaryResponse response = new QueueEntrySummaryResponse();
                response.setQueueNumber(entry.getQueueNumber().longValue());
                response.setStatus(entry.getStatus().name());
                response.setAppointmentId(entry.getAppointmentId());
                if (entry.getAppointmentId() != null) {
                    Appointment appointment = appointments.get(entry.getAppointmentId());
                    if (appointment != null) {
                        response.setPatientId(appointment.getPatientId());
                        response.setDoctorId(appointment.getDoctorId());
                    }
                }
                return response;
            })
            .collect(Collectors.toList());
    }

    private QueueEntryResponse toPatientResponse(QueueEntry entry, Appointment appointment) {
        QueueEntryResponse response = new QueueEntryResponse();
        response.setQueueNumber(entry.getQueueNumber().longValue());
        response.setStatus(entry.getStatus().name());
        response.setAppointmentId(entry.getAppointmentId());
        response.setPatientId(appointment.getPatientId());
        response.setClinicId(entry.getClinicId());
        return response;
    }

    private AppointmentResponse buildQueueAdvanceResponse(QueueEntry entry) {
        AppointmentResponse response = new AppointmentResponse();
        response.setStatus(QueueStatus.CALLED.name());
        if (entry.getAppointmentId() != null) {
            appointmentRepository.findById(entry.getAppointmentId()).ifPresent(appointment -> {
                appointment.setStatus(AppointmentStatus.IN_PROGRESS);
                appointmentRepository.save(appointment);
                response.setId(appointment.getId());
                response.setPatientId(appointment.getPatientId());
                response.setDoctorId(appointment.getDoctorId());
                response.setClinicId(appointment.getClinicId());
                response.setDateTime(appointment.getDateTime());
            });
        }
        return response;
    }

    private void notifyUpcomingPatients(Long clinicId, LocalDate date, int calledNumber) {
        queueEntryRepository.findByClinicIdAndQueueDateOrderByQueueNumberAsc(clinicId, date).stream()
            .filter(QueueEntry::isWaiting)
            .filter(entry -> entry.getQueueNumber() == calledNumber + 3)
            .findFirst()
            .ifPresent(entry -> sendNotification(entry, "You're 3 numbers away. Please get ready."));

        queueEntryRepository.findByClinicIdAndQueueDateOrderByQueueNumberAsc(clinicId, date).stream()
            .filter(entry -> entry.getQueueNumber() == calledNumber)
            .findFirst()
            .ifPresent(entry -> sendNotification(entry, "It's your turn. Please proceed to the counter."));
    }

    private void sendNotification(QueueEntry entry, String message) {
        if (entry.getAppointmentId() == null) {
            return;
        }
        appointmentRepository.findById(entry.getAppointmentId()).ifPresent(appointment -> {
            NotificationRequest request = new NotificationRequest();
            request.setUserId(appointment.getPatientId());
            request.setType(NotificationType.QUEUE_CALLED.name());
            request.setMessage(message);
            notificationService.sendNotification(request);
        });
    }
}
