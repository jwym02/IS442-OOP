package com.clinic.queue.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "staff")
public class Staff extends User {
    private String role;
    private String assignedClinic;

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getAssignedClinic() {
        return assignedClinic;
    }

    public void setAssignedClinic(String assignedClinic) {
        this.assignedClinic = assignedClinic;
    }

}
