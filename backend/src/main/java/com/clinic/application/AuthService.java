package com.clinic.application;

import com.clinic.api.auth.dto.AuthResponse;
import com.clinic.api.auth.dto.LoginRequest;
import com.clinic.api.auth.dto.RegisterRequest;
import com.clinic.domain.entity.PatientProfile;
import com.clinic.domain.entity.RoleEntity;
import com.clinic.domain.entity.UserAccount;
import com.clinic.domain.enums.Roles;
import com.clinic.infrastructure.persistence.AdminProfileRepository;
import com.clinic.infrastructure.persistence.ClinicStaffProfileRepository;
import com.clinic.infrastructure.persistence.DoctorProfileRepository;
import com.clinic.infrastructure.persistence.PatientProfileRepository;
import com.clinic.infrastructure.persistence.RoleRepository;
import com.clinic.infrastructure.persistence.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final ClinicStaffProfileRepository clinicStaffProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final AdminProfileRepository adminProfileRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserAccountRepository userAccountRepository,
                       RoleRepository roleRepository,
                       PatientProfileRepository patientProfileRepository,
                       ClinicStaffProfileRepository clinicStaffProfileRepository,
                       DoctorProfileRepository doctorProfileRepository,
                       AdminProfileRepository adminProfileRepository,
                       PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.roleRepository = roleRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.clinicStaffProfileRepository = clinicStaffProfileRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.adminProfileRepository = adminProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userAccountRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        UserAccount account = new UserAccount();
        account.setId(UUID.randomUUID());
        account.setEmail(request.getEmail());
        account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        account.setFullName(request.getName());
        account.setPhoneNumber(request.getPhone());
        account.addRole(resolveRole(Roles.PATIENT));
        account = userAccountRepository.save(account);

        PatientProfile profile = new PatientProfile();
        profile.setUser(account);
        profile.setFullName(Optional.ofNullable(request.getName()).orElse(account.getFullName()));
        if (StringUtils.hasText(request.getBirthDate())) {
            try {
                profile.setBirthDate(LocalDate.parse(request.getBirthDate()));
            } catch (DateTimeParseException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid birthDate format. Use ISO-8601.", ex);
            }
        }
        patientProfileRepository.save(profile);

        return buildAuthResponse(account);
    }

    public AuthResponse login(LoginRequest request) {
        UserAccount account = userAccountRepository.findByEmail(request.getEmail().toLowerCase(Locale.ROOT))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!passwordEncoder.matches(request.getPassword(), account.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return buildAuthResponse(account);
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!StringUtils.hasText(refreshToken)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token is required");
        }
        // In lieu of a persistent token store, simply return new random tokens.
        AuthResponse response = new AuthResponse();
        response.setToken(UUID.randomUUID().toString());
        response.setRefreshToken(UUID.randomUUID().toString());
        return response;
    }

    private AuthResponse buildAuthResponse(UserAccount account) {
        AuthResponse response = new AuthResponse();
        response.setUserId(account.getId());
        response.setEmail(account.getEmail());
        response.setName(account.getFullName());
        response.setRoles(account.getRoles().stream()
            .map(RoleEntity::getName)
            .sorted()
            .toList());

        patientProfileRepository.findByUserId(account.getId())
            .ifPresent(profile -> response.setPatientProfileId(profile.getId()));

        clinicStaffProfileRepository.findByUserId(account.getId())
            .ifPresent(profile -> {
                response.setStaffProfileId(profile.getId());
                response.setStaffClinicId(profile.getClinicId());
            });

        doctorProfileRepository.findByUserId(account.getId())
            .ifPresent(profile -> {
                response.setDoctorProfileId(profile.getId());
                response.setDoctorClinicId(profile.getClinicId());
            });

        adminProfileRepository.findByUserId(account.getId())
            .ifPresent(profile -> response.setAdminProfileId(profile.getId()));

        response.setToken(UUID.randomUUID().toString());
        response.setRefreshToken(UUID.randomUUID().toString());
        return response;
    }

    private RoleEntity resolveRole(Roles role) {
        return roleRepository.findByName(role.name())
            .orElseGet(() -> roleRepository.save(new RoleEntity(role.name())));
    }
}




