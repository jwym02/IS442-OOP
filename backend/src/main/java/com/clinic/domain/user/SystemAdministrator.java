package com.clinic.domain.user;

import java.util.HashSet;
import java.util.Set;

public class SystemAdministrator extends User {
    private Long adminProfileId;
    private final Set<String> managedRoles = new HashSet<>();

    public SystemAdministrator() {
    }

    public SystemAdministrator(Long adminProfileId) {
        this.adminProfileId = adminProfileId;
    }

    public Long getAdminProfileId() {
        return adminProfileId;
    }

    public void setAdminProfileId(Long adminProfileId) {
        this.adminProfileId = adminProfileId;
    }

    public Set<String> getManagedRoles() {
        return managedRoles;
    }

    public void registerManagedRole(String role) {
        if (role != null) {
            managedRoles.add(role.toUpperCase());
        }
    }
}
