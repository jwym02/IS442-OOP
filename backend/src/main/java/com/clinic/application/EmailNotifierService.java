package com.clinic.application;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class EmailNotifierService {
    private final SendGrid sendGrid;
    private final String fromEmail;
    private final String fromName;

    public EmailNotifierService(
            @Value("${spring.sendgrid.apiKey}") String apiKey,
            @Value("${spring.sendgrid.fromEmail}") String fromEmail,
            @Value("${spring.sendgrid.fromName:SingHealth Clinic}") String fromName) {
        this.sendGrid = new SendGrid(apiKey);
        this.fromEmail = fromEmail;
        this.fromName = fromName;
    }

    public void sendPlain(String to, String subject, String body) {
        if (to == null || to.isBlank()) return;
        Mail mail = new Mail(new Email(fromEmail, fromName), subject, new Email(to),
                             new Content("text/plain", body));
        Request req = new Request();
        try {
            req.setMethod(Method.POST);
            req.setEndpoint("mail/send");
            req.setBody(mail.build());
            sendGrid.api(req);
        } catch (Exception e) {
            throw new RuntimeException("SendGrid send failed", e);
        }
    }
}
