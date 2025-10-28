-- Core reference tables
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    id BINARY(16) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    full_name VARCHAR(255),
    phone_number VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BINARY(16) NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Clinic data
CREATE TABLE IF NOT EXISTS clinics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    phone VARCHAR(20),
    open_time TIME NULL,
    close_time TIME NULL,
    default_slot_interval_minutes INT NOT NULL DEFAULT 15
);

CREATE TABLE IF NOT EXISTS clinic_registry (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255),
    address VARCHAR(1000),
    phone VARCHAR(100),
    specialty VARCHAR(255),
    type VARCHAR(50),
    external_code VARCHAR(50),
    source VARCHAR(50)
);

CREATE UNIQUE INDEX clinic_registry_name_address_type_idx
    ON clinic_registry (name(191), address(191), type);

-- Profile tables
CREATE TABLE IF NOT EXISTS patient_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BINARY(16) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    birth_date DATE,
    CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS doctor_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BINARY(16) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    speciality VARCHAR(255),
    clinic_id BIGINT NULL,
    CONSTRAINT fk_doctor_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_doctor_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

CREATE TABLE IF NOT EXISTS clinic_staff_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BINARY(16) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    clinic_id BIGINT NULL,
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_clinic_staff_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

CREATE TABLE IF NOT EXISTS admin_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BINARY(16) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Scheduling
CREATE TABLE IF NOT EXISTS schedules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    doctor_id BIGINT NOT NULL UNIQUE,
    slot_interval_minutes INT NOT NULL DEFAULT 15,
    CONSTRAINT fk_schedule_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(id)
);

CREATE TABLE IF NOT EXISTS time_slots (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    schedule_id BIGINT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_timeslot_schedule FOREIGN KEY (schedule_id) REFERENCES schedules(id),
    INDEX idx_timeslot_schedule_start (schedule_id, start_time)
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    date_time DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL,
    clinic_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointment_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id),
    CONSTRAINT fk_appointment_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(id),
    CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id),
    INDEX idx_appointment_datetime (date_time),
    INDEX idx_appointment_doctor_datetime (doctor_id, date_time)
);

-- Queue management
CREATE TABLE IF NOT EXISTS queue_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    clinic_id BIGINT NOT NULL,
    queue_date DATE NOT NULL,
    state VARCHAR(20) NOT NULL,
    CONSTRAINT uq_queue_session UNIQUE (clinic_id, queue_date),
    CONSTRAINT fk_queue_session_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

CREATE TABLE IF NOT EXISTS queue_entries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    clinic_id BIGINT NOT NULL,
    queue_date DATE NOT NULL,
    queue_number INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    appointment_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_queue_per_clinic_date UNIQUE (clinic_id, queue_date, queue_number),
    CONSTRAINT fk_queue_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id),
    CONSTRAINT fk_queue_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    INDEX idx_queue_clinic_date (clinic_id, queue_date)
);

-- Medical records
CREATE TABLE IF NOT EXISTS medical_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_id BIGINT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_medical_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id),
    CONSTRAINT fk_medical_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(id),
    CONSTRAINT fk_medical_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BINARY(16) NOT NULL,
    type VARCHAR(50) NOT NULL,
    message VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_flag BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id)
);
