package com.clinic.queue.model;

public abstract class User {
    // Attributes
    private long userId;
    private String name;
    private String email;
    private String contact;
    private char[] passwordHash;

    // Constructor
    public User(long userId, String name, String email, String contact, char[] passwordHash) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.contact = contact;
        this.passwordHash = passwordHash;
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

    public char[] getPasswordHash() { 
        return passwordHash; 
    }
    public void setPasswordHash(char[] passwordHash) {
        this.passwordHash = passwordHash;
    }

    @Override
    public int hashCode() {
        return Long.hashCode(userId);
    }
}

