package com.clinic.api.admin.dto;

import jakarta.validation.constraints.NotNull;

public class ClinicRequest {
    @NotNull
    private String name;
    @NotNull
    private String address;

    // getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}
