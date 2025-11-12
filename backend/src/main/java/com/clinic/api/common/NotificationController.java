package com.clinic.api.common;

import com.clinic.api.common.dto.NotificationRequest;
import jakarta.validation.Valid;
import com.clinic.application.NotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "API for notifications")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    public ResponseEntity<Void> sendNotification(@RequestBody @Valid NotificationRequest request) {
        notificationService.sendNotification(request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/welcome")
    public ResponseEntity<Void> sendWelcomeNotification(@RequestBody @Valid NotificationRequest request) {
        notificationService.sendWelcomeNotification(request);
        return ResponseEntity.accepted().build();
    }
}


