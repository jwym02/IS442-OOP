package com.clinic.queue.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "doctor")
public class Doctor extends Staff {

    private String specialty;
    private Schedule schedule;

    public String getSpeciality() {
        return specialty;
    }

    public void setSpecialty(String specialty){
        this.specialty = specialty;
    }

    public Schedule getSchedule() {
        return schedule;
    }

    public void setSchedule(Schedule schedule) {
        this.schedule = schedule;
    }

}
