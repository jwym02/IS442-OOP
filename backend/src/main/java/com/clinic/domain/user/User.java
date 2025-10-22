package com.clinic.domain.user;

import java.util.UUID;

/**
 * Shared attributes for all user roles in the system.
 * Behaviour that requires application services is orchestrated in the service layer,
 * but the domain model keeps core identity data cohesive.
 */
public abstract class User {
    private UUID userId;
    private String name;
    private String email;
    private String phoneNumber;
    private String passwordHash;

    protected User() {
    }

    protected User(UUID userId, String name, String email, String phoneNumber, String passwordHash) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.passwordHash = passwordHash;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void updateContactDetails(String newName, String newEmail, String newPhone) {
        if (newName != null) {
            this.name = newName;
        }
        if (newEmail != null) {
            this.email = newEmail;
        }
        if (newPhone != null) {
            this.phoneNumber = newPhone;
        }
    }
}
