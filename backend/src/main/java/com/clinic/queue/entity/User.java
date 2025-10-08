package com.clinic.queue.entity;

import org.mindrot.jbcrypt.BCrypt;

import jakarta.persistence.*;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class User {
    // Attributes
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    protected long userId;
    private String name;
    private String email;
    private String contact;
    private String passwordHash;


    // Password handling
    // TODO: Move to service?
    public void setPassword(String rawPassword) {
        this.passwordHash = BCrypt.hashpw(rawPassword, BCrypt.gensalt());
    }

    public boolean checkPassword(String rawPassword) {
        return BCrypt.checkpw(rawPassword, this.passwordHash);
    }

    // Getters and Setters
    public long getUserId() { 
        return userId; 
    }
    public void setUserId(long userId) { 
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

    public String getContact() { 
        return contact;
    }
    public void setContact(String contact) { 
        this.contact = contact; 
    }

    public String getPasswordHash() { 
        return passwordHash; 
    }

    @Override
    public int hashCode() {
        return Long.hashCode(userId);
    }
}

