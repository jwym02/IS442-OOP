package com.clinic.api.admin.dto;

public class ClinicResponse {
    private Long id;
    private String name;
    private String address;
    private String openTime;
    private String closeTime;
    private Integer defaultSlotIntervalMinutes;

    // getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getOpenTime() { return openTime; }
    public void setOpenTime(String openTime) { this.openTime = openTime; }
    public String getCloseTime() { return closeTime; }
    public void setCloseTime(String closeTime) { this.closeTime = closeTime; }
    public Integer getDefaultSlotIntervalMinutes() { return defaultSlotIntervalMinutes; }
    public void setDefaultSlotIntervalMinutes(Integer defaultSlotIntervalMinutes) { this.defaultSlotIntervalMinutes = defaultSlotIntervalMinutes; }
}
