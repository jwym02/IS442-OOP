<<<<<<<< HEAD:backend/src/main/java/com/clinic/queue/model/User.java
package com.clinic.queue.model;
========
package com.clinic.queue.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
>>>>>>>> origin/main:backend/src/main/java/com/clinic/queue/entity/User.java

import org.mindrot.jbcrypt.BCrypt;

@Entity
public class User {
    // Attributes
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long userId;
    private String name;
    private String email;
    private String contact;
    private String passwordHash;

    // not needed?
    // // Constructor
    // public User(long userId, String name, String email, String contact, String rawPassword) {
    //     this.userId = userId;
    //     this.name = name;
    //     this.email = email;
    //     this.contact = contact;
    //     setPassword(rawPassword); // Password hash
    // }

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

