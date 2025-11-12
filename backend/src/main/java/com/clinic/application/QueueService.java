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
import com.clinic.infrastructure.persistence.DoctorProfileRepository;
import com.clinic.infrastructure.persistence.PatientProfileRepository;
import com.clinic.infrastructure.persistence.QueueEntryRepository;
import com.clinic.infrastructure.persistence.QueueSessionRepository;
import com.clinic.websocket.WebSocketHandler;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.HashMap;
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
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final WebSocketHandler webSocketHandler;

    public QueueService(
            QueueEntryRepository queueEntryRepository,
            QueueSessionRepository queueSessionRepository,
            AppointmentRepository appointmentRepository,
            NotificationService notificationService,
            MedicalRecordService medicalRecordService,
            PatientProfileRepository patientProfileRepository,
            DoctorProfileRepository doctorProfileRepository,
            WebSocketHandler webSocketHandler) {
        this.appointmentRepository = appointmentRepository;
        this.queueEntryRepository = queueEntryRepository;
        this.queueSessionRepository = queueSessionRepository;
        this.notificationService = notificationService;
        this.medicalRecordService = medicalRecordService;
        this.patientProfileRepository = patientProfileRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.webSocketHandler = webSocketHandler;
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

        // Only consider appointments that are checked-in — queue status tied to checked-in appointment
        List<Appointment> checkedIn = appointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN)
                .collect(Collectors.toList());

        if (checkedIn.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No active checked-in appointment for patient");
        }

        // Find checked-in appointment with a queue entry, preferring priority queue statuses
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
        
        final QueueEntry finalMyEntry = myEntry;
        int numbersAway = 0;
        if (myEntry.getStatus() == QueueStatus.WAITING || 
            myEntry.getStatus() == QueueStatus.FAST_TRACKED || 
            myEntry.getStatus() == QueueStatus.CALLED) {
            numbersAway = (int) entries.stream()
                    .filter(entry -> EnumSet.of(QueueStatus.WAITING, QueueStatus.FAST_TRACKED, QueueStatus.CALLED)
                            .contains(entry.getStatus()))
                    .filter(entry -> entry.getQueueNumber() < finalMyEntry.getQueueNumber())
                    .count();
        }
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
        if (session.getState() == QueueState.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Queue session already started");
        }
        session.start();
        queueSessionRepository.save(session);
    }

    @Transactional
    public void pause(Long clinicId) {
        QueueSession session = queueSessionRepository.findByClinicIdAndQueueDate(clinicId, LocalDate.now())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Queue session not started"));
        if (session.getState() == QueueState.PAUSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Queue session already paused");
        }
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

        // publish websocket snapshot so frontend updates immediately when queue advances
        publishQueueSnapshot(clinicId);
        
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
                        medicalRecordService.createFromAppointmentIfMissing(appointment);
                    }
                    case CANCELLED -> appointment.setStatus(AppointmentStatus.CANCELLED);
                    case SKIPPED -> appointment.setStatus(AppointmentStatus.NO_SHOW);
                    default -> {
                    }
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
                            patientProfileRepository.findById(appointment.getPatientId())
                                .ifPresent(profile -> response.setPatientName(profile.getFullName()));
                            doctorProfileRepository.findById(appointment.getDoctorId())
                                .ifPresent(profile -> response.setDoctorName(profile.getFullName()));
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
                .ifPresent(entry -> sendNotification(entry,
                        NotificationType.REMINDER,
                        "You are 3 patients away. Please proceed closer to the consultation room."));

        queueEntryRepository.findByClinicIdAndQueueDateOrderByQueueNumberAsc(clinicId, date).stream()
                .filter(entry -> entry.getQueueNumber() == calledNumber)
                .findFirst()
                .ifPresent(entry -> sendNotification(entry,
                        NotificationType.QUEUE_CALLED,
                        "It’s your turn. Kindly proceed to the consultation room."));
    }

    private void sendNotification(QueueEntry entry, NotificationType type, String message) {
        if (entry.getAppointmentId() == null) {
            return;
        }
        appointmentRepository.findById(entry.getAppointmentId()).ifPresent(appointment -> {
            NotificationRequest request = new NotificationRequest();
            request.setUserId(appointment.getPatientId());
            request.setType(type.name());
            request.setMessage(message);
            notificationService.sendNotification(request);
        });
    }

    // Staff functions

    @Transactional
    public void staffStart(Long clinicId) {
        LocalDate today = LocalDate.now();
        QueueSession session = queueSessionRepository.findByClinicIdAndQueueDate(clinicId, today)
                .orElseGet(() -> {
                    QueueSession created = new QueueSession();
                    created.setClinicId(clinicId);
                    created.setQueueDate(today);
                    return created;
                });
        if (session.getState() == QueueState.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Queue session already started");
        }
        session.start();
        queueSessionRepository.save(session);

        // After starting, publish queue snapshot
        publishQueueSnapshot(clinicId);
    }

    @Transactional
    public void staffNext(Long clinicId) {
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

        // After moving to next, publish queue snapshot
        publishQueueSnapshot(clinicId);
    }

    // Helper: assemble minimal queue snapshot and broadcast
    private void publishQueueSnapshot(Long clinicId) {
        LocalDate today = LocalDate.now();
        List<QueueStatus> statuses = List.of(QueueStatus.WAITING, QueueStatus.FAST_TRACKED, QueueStatus.CALLED);
        List<QueueEntry> entries = queueEntryRepository.findByClinicIdAndQueueDateAndStatusInOrderByQueueNumberAsc(clinicId, today, statuses);

        int total = entries.size();

        // batch-load appointments referenced by queue entries to obtain patientId/doctorId
        List<Long> apptIds = entries.stream()
                .map(QueueEntry::getAppointmentId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, Appointment> apptMap = new HashMap<>();
        if (!apptIds.isEmpty()) {
            appointmentRepository.findAllById(apptIds).forEach(a -> apptMap.put(a.getId(), a));
        }

        Map<String, Object> next = null;
        if (!entries.isEmpty()) {
            QueueEntry first = entries.get(0);
            Map<String, Object> m = new HashMap<>();
            m.put("queueNumber", first.getQueueNumber());
            Appointment a = first.getAppointmentId() != null ? apptMap.get(first.getAppointmentId()) : null;

            // resolve names (send names instead of IDs)
            String patientName = null;
            String doctorName = null;
            if (a != null) {
                Long pid = a.getPatientId();
                Long did = a.getDoctorId();
                if (pid != null) {
                    var opt = patientProfileRepository.findById(pid);
                    if (opt.isPresent()) patientName = opt.get().getFullName();
                }
                if (did != null) {
                    var optD = doctorProfileRepository.findById(did);
                    if (optD.isPresent()) doctorName = optD.get().getFullName();
                }
            }
            m.put("patientName", patientName);
            m.put("doctorName", doctorName);

            m.put("status", first.getStatus() != null ? first.getStatus().name() : null);
            next = m;
        }

        List<Map<String, Object>> queue = new ArrayList<>();
        for (QueueEntry e : entries) {
            Map<String, Object> m = new HashMap<>();
            m.put("queueNumber", e.getQueueNumber());
            Appointment a = e.getAppointmentId() != null ? apptMap.get(e.getAppointmentId()) : null;

            // resolve names (send names instead of IDs)
            String patientName = null;
            String doctorName = null;
            if (a != null) {
                Long pid = a.getPatientId();
                Long did = a.getDoctorId();
                if (pid != null) {
                    var opt = patientProfileRepository.findById(pid);
                    if (opt.isPresent()) patientName = opt.get().getFullName();
                }
                if (did != null) {
                    var optD = doctorProfileRepository.findById(did);
                    if (optD.isPresent()) doctorName = optD.get().getFullName();
                }
            }
            m.put("patientName", patientName);
            m.put("doctorName", doctorName);

            m.put("status", e.getStatus() != null ? e.getStatus().name() : null);
            queue.add(m);
        }

        webSocketHandler.sendQueueUpdate(clinicId, total, next, queue);
    }
}
