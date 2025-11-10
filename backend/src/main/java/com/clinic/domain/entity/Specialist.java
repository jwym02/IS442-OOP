package com.clinic.domain.entity;

import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "specialists")
public class Specialist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String address;

    // keep as String to allow +, leading zeros, etc.
    @Column
    private String phone;

    @Column(name = "open_time")
    private LocalTime openTime;

    @Column(name = "close_time")
    private LocalTime closeTime;

    @Column(name = "default_slot_interval_minutes")
    private Integer defaultSlotIntervalMinutes;

    // getters / setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public LocalTime getOpenTime() { return openTime; }
    public void setOpenTime(LocalTime openTime) { this.openTime = openTime; }

    public LocalTime getCloseTime() { return closeTime; }
    public void setCloseTime(LocalTime closeTime) { this.closeTime = closeTime; }

    public Integer getDefaultSlotIntervalMinutes() { return defaultSlotIntervalMinutes; }
    public void setDefaultSlotIntervalMinutes(Integer defaultSlotIntervalMinutes) { this.defaultSlotIntervalMinutes = defaultSlotIntervalMinutes; }
}