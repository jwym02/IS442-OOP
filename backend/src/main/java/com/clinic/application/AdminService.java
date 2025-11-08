package com.clinic.application;

import com.clinic.api.admin.dto.*;
import com.clinic.domain.entity.*;
import com.clinic.domain.enums.AppointmentStatus;
import com.clinic.domain.enums.Roles;
import com.clinic.domain.stats.SystemStats;
import com.clinic.infrastructure.persistence.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final ClinicRepository clinicRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final ClinicStaffProfileRepository clinicStaffProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final AdminProfileRepository adminProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final QueueEntryRepository queueEntryRepository;
    private final PasswordEncoder passwordEncoder;
    private final ReportService reportService;

    public AdminService(ClinicRepository clinicRepository,
                        ScheduleRepository scheduleRepository,
                        UserAccountRepository userAccountRepository,
                        RoleRepository roleRepository,
                        PatientProfileRepository patientProfileRepository,
                        ClinicStaffProfileRepository clinicStaffProfileRepository,
                        DoctorProfileRepository doctorProfileRepository,
                        AdminProfileRepository adminProfileRepository,
                        AppointmentRepository appointmentRepository,
                        QueueEntryRepository queueEntryRepository,
                        PasswordEncoder passwordEncoder,
                        ReportService reportService) {
        this.clinicRepository = clinicRepository;
        this.scheduleRepository = scheduleRepository;
        this.userAccountRepository = userAccountRepository;
        this.roleRepository = roleRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.clinicStaffProfileRepository = clinicStaffProfileRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.adminProfileRepository = adminProfileRepository;
        this.appointmentRepository = appointmentRepository;
        this.queueEntryRepository = queueEntryRepository;
        this.passwordEncoder = passwordEncoder;
        this.reportService = reportService;
    }

    @Transactional
    public UserResponse createUser(UserRequest request) {
        if (!StringUtils.hasText(request.getEmail())
            || !StringUtils.hasText(request.getPassword())
            || !StringUtils.hasText(request.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email, password, and role are required");
        }
        if (userAccountRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        Roles role = parseRole(request.getRole());
        UserAccount account = new UserAccount();
        account.setId(UUID.randomUUID());
        account.setEmail(request.getEmail());
        account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        account.setFullName(request.getName());
        account.setPhoneNumber(request.getPhone());
        account.addRole(resolveRole(role));
        account = userAccountRepository.save(account);

        switch (role) {
            case PATIENT -> createPatientProfile(account, request);
            case CLINIC_STAFF -> createClinicStaffProfile(account, request);
            case SYSTEM_ADMINISTRATOR -> createAdminProfile(account, request);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported role " + role);
        }

        if (Boolean.TRUE.equals(request.getDoctor())) {
            createDoctorProfile(account, request);
        }

        return toResponse(account);
    }

    @Transactional
    public UserResponse updateUser(UUID userId, UserRequest request) {
        UserAccount account = userAccountRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (StringUtils.hasText(request.getEmail()) && !request.getEmail().equalsIgnoreCase(account.getEmail())) {
            if (userAccountRepository.existsByEmail(request.getEmail())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
            }
            account.setEmail(request.getEmail());
        }
        if (StringUtils.hasText(request.getPassword())) {
            account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        if (StringUtils.hasText(request.getName())) {
            account.setFullName(request.getName());
        }
        if (StringUtils.hasText(request.getPhone())) {
            account.setPhoneNumber(request.getPhone());
        }

        // Update staff profile clinic assignment if applicable
        if (request.getClinicId() != null) {
            clinicStaffProfileRepository.findByUserId(userId).ifPresent(profile -> {
                profile.setClinicId(request.getClinicId());
                clinicStaffProfileRepository.save(profile);
            });
        }

        // Update or create doctor profile if applicable
        if (Boolean.TRUE.equals(request.getDoctor())) {
            DoctorProfile doctorProfile = doctorProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    DoctorProfile newProfile = new DoctorProfile();
                    newProfile.setUser(account);
                    return newProfile;
                });
            doctorProfile.setFullName(Optional.ofNullable(request.getName()).orElse(account.getFullName()));
            if (request.getClinicId() != null) {
                doctorProfile.setClinicId(request.getClinicId());
            }
            if (StringUtils.hasText(request.getSpeciality())) {
                doctorProfile.setSpeciality(request.getSpeciality());
            }
            doctorProfileRepository.save(doctorProfile);
        }

        userAccountRepository.save(account);
        return toResponse(account);
    }

    @Transactional
    public void deleteUser(UUID userId) {
        UserAccount account = userAccountRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        patientProfileRepository.findByUserId(userId).ifPresent(patientProfileRepository::delete);
        clinicStaffProfileRepository.findByUserId(userId).ifPresent(clinicStaffProfileRepository::delete);
        doctorProfileRepository.findByUserId(userId).ifPresent(doctorProfileRepository::delete);
        adminProfileRepository.findByUserId(userId).ifPresent(adminProfileRepository::delete);

        userAccountRepository.delete(account);
    }

    @Transactional
    public UserResponse assignRoles(UUID userId, String roleName) {
        Roles role = parseRole(roleName);
        UserAccount account = userAccountRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        account.addRole(resolveRole(role));
        userAccountRepository.save(account);
        return toResponse(account);
    }

    @Transactional
    public ClinicResponse updateClinic(Long clinicId, ClinicRequest request) {
        Clinic clinic = clinicRepository.findById(clinicId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinic not found"));
        clinic.setName(request.getName());
        clinic.setAddress(request.getAddress());
        clinic = clinicRepository.save(clinic);
        return toClinicResponse(clinic);
    }

    @Transactional
    public void updateDoctorSchedule(Long doctorId, ScheduleUpdateRequest req) {
        Schedule schedule = scheduleRepository.findByDoctorId(doctorId).orElseGet(() -> {
            Schedule s = new Schedule();
            s.setDoctorId(doctorId);
            return s;
        });
        if (req.getSlotIntervalMinutes() != null && req.getSlotIntervalMinutes() > 0) {
            schedule.setSlotIntervalMinutes(req.getSlotIntervalMinutes());
        }
        scheduleRepository.save(schedule);
    }

    @Transactional
    public void updateSlotInterval(Long clinicId, Integer minutes) {
        if (minutes == null || minutes <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid slot interval");
        }
        Clinic clinic = clinicRepository.findById(clinicId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinic not found"));
        clinic.setDefaultSlotIntervalMinutes(minutes);
        clinicRepository.save(clinic);
    }

    @Transactional
    public void updateClinicHours(Long clinicId, OperatingHoursRequest req) {
        Clinic clinic = clinicRepository.findById(clinicId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinic not found"));
        LocalTime open = parseTime(req.getOpenTime());
        LocalTime close = parseTime(req.getCloseTime());
        if (open != null && close != null && !open.isBefore(close)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Open time must be before close time");
        }
        clinic.setOpenTime(open);
        clinic.setCloseTime(close);
        clinicRepository.save(clinic);
    }

    public void backup() {
        // Placeholder for future integration with storage backup solution.
    }

    public void restore() {
        // Placeholder for future integration with storage restore solution.
    }

    public SystemStatsResponse getSystemStats() {
        SystemStats stats = reportService.generateSystemUsageReport(LocalDate.now());
        SystemStatsResponse response = new SystemStatsResponse();
        response.setTotalAppointments(stats.getTotalAppointments());
        response.setCancellations(stats.getCancellations());
        response.setCompletedAppointments(stats.getCompletedAppointments());
        response.setTotalUsers(stats.getTotalUsers());
        response.setActiveClinics(stats.getActiveClinics());
        response.setQueueStatistics(stats.getQueueSummary());
        response.setReportGeneratedAt(stats.getReportGeneratedAt());
        return response;
    }

    public List<ClinicResponse> listClinics() {
        return clinicRepository.findAll().stream()
            .map(this::toClinicResponse)
            .collect(Collectors.toList());
    }

    public List<DoctorAdminResponse> listDoctors() {
        Map<Long, Schedule> schedulesByDoctor = scheduleRepository.findAll().stream()
            .collect(Collectors.toMap(Schedule::getDoctorId, s -> s));

        return doctorProfileRepository.findAll().stream()
            .map(profile -> {
                DoctorAdminResponse dto = new DoctorAdminResponse();
                dto.setId(profile.getId());
                dto.setFullName(profile.getFullName());
                dto.setSpeciality(profile.getSpeciality());
                dto.setClinicId(profile.getClinicId());
                Schedule schedule = schedulesByDoctor.get(profile.getId());
                dto.setSlotIntervalMinutes(schedule != null ? schedule.getSlotIntervalMinutes() : null);
                return dto;
            })
            .collect(Collectors.toList());
    }

    private void createPatientProfile(UserAccount account, UserRequest request) {
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
    }

    private void createClinicStaffProfile(UserAccount account, UserRequest request) {
        if (request.getClinicId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Clinic assignment is required for clinic staff");
        }
        Clinic clinic = clinicRepository.findById(request.getClinicId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinic not found"));
        ClinicStaffProfile profile = new ClinicStaffProfile();
        profile.setUser(account);
        profile.setFullName(Optional.ofNullable(request.getName()).orElse(account.getFullName()));
        profile.setClinicId(clinic.getId());
        clinicStaffProfileRepository.save(profile);
    }

    private void createDoctorProfile(UserAccount account, UserRequest request) {
        if (request.getClinicId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Clinic assignment is required for doctor profile");
        }
        doctorProfileRepository.findByUserId(account.getId()).ifPresent(existing -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Doctor profile already exists for this user");
        });
        Clinic clinic = clinicRepository.findById(request.getClinicId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinic not found"));
        DoctorProfile profile = new DoctorProfile();
        profile.setUser(account);
        profile.setFullName(Optional.ofNullable(request.getName()).orElse(account.getFullName()));
        profile.setSpeciality(request.getSpeciality());
        profile.setClinicId(clinic.getId());
        doctorProfileRepository.save(profile);
    }

    private void createAdminProfile(UserAccount account, UserRequest request) {
        AdminProfile profile = new AdminProfile();
        profile.setUser(account);
        profile.setFullName(Optional.ofNullable(request.getName()).orElse(account.getFullName()));
        adminProfileRepository.save(profile);
    }

    private RoleEntity resolveRole(Roles role) {
        return roleRepository.findByName(role.name())
            .orElseGet(() -> roleRepository.save(new RoleEntity(role.name())));
    }

    private Roles parseRole(String value) {
        try {
            return Roles.valueOf(value == null ? "" : value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown role: " + value, ex);
        }
    }

    private ClinicResponse toClinicResponse(Clinic clinic) {
        ClinicResponse response = new ClinicResponse();
        response.setId(clinic.getId());
        response.setName(clinic.getName());
        response.setAddress(clinic.getAddress());
        response.setOpenTime(clinic.getOpenTime() != null ? clinic.getOpenTime().toString() : null);
        response.setCloseTime(clinic.getCloseTime() != null ? clinic.getCloseTime().toString() : null);
        response.setDefaultSlotIntervalMinutes(clinic.getDefaultSlotIntervalMinutes());
        return response;
    }

    private UserResponse toResponse(UserAccount account) {
        UserResponse response = new UserResponse();
        response.setId(account.getId().toString());
        response.setEmail(account.getEmail());
        response.setName(account.getFullName());
        response.setPhone(account.getPhoneNumber());

        List<String> roles = account.getRoles().stream()
            .map(RoleEntity::getName)
            .sorted()
            .toList();
        response.setRoles(roles);

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
                response.setSpeciality(profile.getSpeciality());
            });
        adminProfileRepository.findByUserId(account.getId())
            .ifPresent(profile -> response.setAdminProfileId(profile.getId()));
        return response;
    }

    private LocalTime parseTime(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return LocalTime.parse(value);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid time format. Use HH:mm.", ex);
        }
    }

    public SystemStatsResponse buildClinicSnapshot(Long clinicId) {
        List<Appointment> todaysAppointments = appointmentRepository.findByClinicIdAndDateTimeBetween(
            clinicId,
            LocalDate.now().atStartOfDay(),
            LocalDate.now().plusDays(1).atStartOfDay()
        );
        Map<AppointmentStatus, Long> statusCounts = todaysAppointments.stream()
            .collect(Collectors.groupingBy(Appointment::getStatus, Collectors.counting()));

        LocalDate today = LocalDate.now();
        Map<String, Long> queueCounts = queueEntryRepository.findByQueueDate(today).stream()
            .filter(entry -> Objects.equals(entry.getClinicId(), clinicId))
            .collect(Collectors.groupingBy(entry -> entry.getStatus().name(), Collectors.counting()));

        SystemStatsResponse snapshot = new SystemStatsResponse();
        snapshot.setTotalAppointments(todaysAppointments.size());
        snapshot.setCompletedAppointments(statusCounts.getOrDefault(AppointmentStatus.COMPLETED, 0L).intValue());
        snapshot.setCancellations(statusCounts.getOrDefault(AppointmentStatus.CANCELLED, 0L).intValue());
        snapshot.setQueueStatistics(queueCounts.toString());
        snapshot.setReportGeneratedAt(LocalDateTime.now());
        return snapshot;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers() {
        return userAccountRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
}


