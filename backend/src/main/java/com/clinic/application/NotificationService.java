package com.clinic.application;

import com.clinic.api.common.dto.NotificationRequest;
import com.clinic.domain.entity.NotificationEntity;
import com.clinic.domain.entity.PatientProfile;
import com.clinic.domain.entity.UserAccount;
import com.clinic.domain.enums.NotificationType;
import com.clinic.infrastructure.persistence.NotificationRepository;
import com.clinic.infrastructure.persistence.PatientProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    public NotificationService(NotificationRepository notificationRepository,
                               PatientProfileRepository patientProfileRepository) {
        this.notificationRepository = notificationRepository;
        this.patientProfileRepository = patientProfileRepository;
    }

    @Transactional
    public void sendNotification(NotificationRequest request) {
        if (request == null) {
            return;
        }
        if (!StringUtils.hasText(request.getMessage())) {
            log.warn("Skipping notification with empty message");
            return;
        }

        Optional<UserAccount> recipient = resolveRecipient(request.getUserId());
        if (recipient.isEmpty()) {
            log.warn("Unable to resolve recipient for notification, patientId={}", request.getUserId());
            return;
        }

        NotificationEntity entity = new NotificationEntity();
        entity.setUser(recipient.get());
        entity.setType(resolveType(request.getType()));
        entity.setMessage(request.getMessage());
        entity.setReadFlag(false);

        notificationRepository.save(entity);

        if (request.getSendAt() != null && request.getSendAt().isAfter(entity.getCreatedAt())) {
            log.info("Notification scheduled for {} type={} recipient={} message={}",
                request.getSendAt(), entity.getType(), recipient.get().getId(), request.getMessage());
        } else {
            log.info("Notification dispatched type={} recipient={} message={}",
                entity.getType(), recipient.get().getId(), request.getMessage());
        }
    }

    private Optional<UserAccount> resolveRecipient(Long patientId) {
        if (patientId == null) {
            return Optional.empty();
        }
        return patientProfileRepository.findById(patientId)
            .map(PatientProfile::getUser);
    }

    private NotificationType resolveType(String typeValue) {
        if (!StringUtils.hasText(typeValue)) {
            return NotificationType.BROADCAST;
        }
        String trimmed = typeValue.trim().toUpperCase(Locale.ROOT);
        try {
            return NotificationType.valueOf(trimmed);
        } catch (IllegalArgumentException ex) {
            if ("SMS".equals(trimmed) || "QUEUE".equals(trimmed)) {
                return NotificationType.QUEUE_CALLED;
            }
            if ("EMAIL".equals(trimmed) || "REMINDER".equals(trimmed)) {
                return NotificationType.REMINDER;
            }
            return NotificationType.BROADCAST;
        }
    }
}
