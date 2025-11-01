package com.clinic.application;

import com.clinic.api.common.dto.NotificationRequest;
import com.clinic.application.EmailNotifierService;
import com.clinic.domain.entity.NotificationEntity;
import com.clinic.domain.entity.PatientProfile;
import com.clinic.domain.entity.UserAccount;
import com.clinic.domain.enums.NotificationType;
import com.clinic.infrastructure.persistence.NotificationRepository;
import com.clinic.infrastructure.persistence.PatientProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.Optional;

@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final EmailNotifierService emailNotifier;

    @Value("${notifications.emailEnabled:true}")
    private boolean emailEnabled;

    public NotificationService(NotificationRepository notificationRepository,
                               PatientProfileRepository patientProfileRepository,
                               EmailNotifierService emailNotifier) {
        this.notificationRepository = notificationRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.emailNotifier = emailNotifier;
    }

    @Transactional
    public void sendNotification(NotificationRequest request) {
        if (request == null) return;
        if (!StringUtils.hasText(request.getMessage())) {
            log.warn("Skipping notification with empty message");
            return;
        }

        Optional<UserAccount> recipient = resolveRecipient(request.getUserId());
        if (recipient.isPresent()) {
            log.info("Resolved recipient userId={} email={}", recipient.get().getId(), safeEmail(recipient.get()));
        }
        if (recipient.isEmpty()) {
            log.warn("Unable to resolve recipient for notification, patientId={}", request.getUserId());
            return;
        }

        NotificationType type = resolveType(request.getType());

        NotificationEntity entity = new NotificationEntity();
        entity.setUser(recipient.get());
        entity.setType(type);
        entity.setMessage(request.getMessage());
        entity.setReadFlag(false);

        notificationRepository.save(entity);

        if (emailEnabled) {
            String toEmail = safeEmail(recipient.get());
            if (StringUtils.hasText(toEmail)) {
                String subject = subjectFor(type);
                String body = request.getMessage(); // already formatted upstream
                try {
                    emailNotifier.sendPlain(toEmail, subject, body);
                    log.info("Email sent to {} subject={} type={}", toEmail, subject, type);
                } catch (RuntimeException e) {
                    log.error("Failed to send email to {} type={} err={}", toEmail, type, e.getMessage());
                }
            } else {
                log.info("No email on file for userId={}, skip email send", recipient.get().getId());
            }
        }

        if (request.getSendAt() != null && request.getSendAt().isAfter(entity.getCreatedAt())) {
            log.info("Notification scheduled for {} type={} recipient={} message={}",
                    request.getSendAt(), entity.getType(), recipient.get().getId(), request.getMessage());
        } else {
            log.info("Notification dispatched type={} recipient={} message={}",
                    entity.getType(), recipient.get().getId(), request.getMessage());
        }
    }

    private Optional<UserAccount> resolveRecipient(Long patientId) {
        if (patientId == null) return Optional.empty();
        return patientProfileRepository.findById(patientId).map(PatientProfile::getUser);
    }

    // Extract email safely from your UserAccount (adapt getter name if different)
    private String safeEmail(UserAccount ua) {
        try {
            return "jovanwang2002@gmail.com";
            // return ua.getEmail(); // <-- change if your field/method is different
        } catch (Exception e) {
            return null;
        }
    }

    private NotificationType resolveType(String typeValue) {
        if (!StringUtils.hasText(typeValue)) return NotificationType.BROADCAST;
        String trimmed = typeValue.trim().toUpperCase(Locale.ROOT);
        try {
            return NotificationType.valueOf(trimmed);
        } catch (IllegalArgumentException ex) {
            if ("SMS".equals(trimmed) || "QUEUE".equals(trimmed)) return NotificationType.QUEUE_CALLED;  // “turn now”
            if ("EMAIL".equals(trimmed) || "REMINDER".equals(trimmed)) return NotificationType.REMINDER; // “3-away”
            return NotificationType.BROADCAST;
        }
    }

    private String subjectFor(NotificationType type) {
        return switch (type) {
            case QUEUE_CALLED -> "Queue Update – It’s Your Turn";
            case REMINDER -> "Queue Update – 3 Patients Away";
            default -> "Notification from SingHealth Clinic";
        };
    }
}
