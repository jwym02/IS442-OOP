START TRANSACTION;

-- ensure specialists table exists (V6 should already create it, safe to keep)
CREATE TABLE IF NOT EXISTS `specialists` (
  `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `address` VARCHAR(1000) DEFAULT NULL,
  `phone` VARCHAR(255) DEFAULT NULL,
  `open_time` TIME DEFAULT NULL,
  `close_time` TIME DEFAULT NULL,
  `default_slot_interval_minutes` INT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert specialists referenced by clinicdb.sql (idempotent)
INSERT INTO specialists (id, name, address, phone, open_time, close_time, default_slot_interval_minutes)
VALUES
  (1,'CH POH DIGESTIVE & LIVER CLINIC PTE','LTD 38 IRRAWADDY ROAD #09-46 MOUNT ELIZABETH NOVENA SINGAPORE 329563','66946988','08:30:00','17:00:00',15),
  (2,'NOVENA SPECIALIST CENTRE SINGAPORE 329563','CENTRAL NOVENA ISLAND ORTHOPAEDIC CONSULTANTS PTE LTD (MT E NOVENA) 38 IRRAWADDY ROAD #05-42 MOUNT E','63520529','09:00:00','17:00:00',15)
ON DUPLICATE KEY UPDATE id = id; -- no-op if row exists

-- If you want all 1..100 entries from clinicdb.sql, append them to the VALUES list above.

-- 4 specialist user accounts: insert only if email missing (generate binary id with UUID_TO_BIN)
INSERT INTO users (id, email, password_hash, enabled, created_at, full_name, phone_number)
SELECT UUID_TO_BIN(UUID()), 'j.lee@chpoh.specialist', '$2a$10$Zz3gKcPgvpEBRvIUj/9dGuioWyhrc4pdazVephs8qAH90u1KZt94K', 1, '2025-11-09 17:01:01', 'Dr. Jonathan Lee', '+65 8000 0205'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'j.lee@chpoh.specialist');

INSERT INTO users (id, email, password_hash, enabled, created_at, full_name, phone_number)
SELECT UUID_TO_BIN(UUID()), 'm.tan@chpoh.specialist', '$2a$10$Zz3gKcPgvpEBRvIUj/9dGuioWyhrc4pdazVephs8qAH90u1KZt94K', 1, '2025-11-09 17:01:01', 'Dr. Melissa Tan', '+65 8000 0206'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'm.tan@chpoh.specialist');

INSERT INTO users (id, email, password_hash, enabled, created_at, full_name, phone_number)
SELECT UUID_TO_BIN(UUID()), 'aar.ng@chpoh.specialist', '$2a$10$Zz3gKcPgvpEBRvIUj/9dGuioWyhrc4pdazVephs8qAH90u1KZt94K', 1, '2025-11-09 17:01:01', 'Dr. Aaron Ng', '+65 8000 0207'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'aar.ng@chpoh.specialist');

INSERT INTO users (id, email, password_hash, enabled, created_at, full_name, phone_number)
SELECT UUID_TO_BIN(UUID()), 'g.chew@chpoh.specialist', '$2a$10$Zz3gKcPgvpEBRvIUj/9dGuioWyhrc4pdazVephs8qAH90u1KZt94K', 1, '2025-11-09 17:01:01', 'Dr. Grace Chew', '+65 8000 0208'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'g.chew@chpoh.specialist');

-- create doctor_profiles for those users and link specialist_id
INSERT INTO doctor_profiles (user_id, full_name, specialty, clinic_id, specialist_id)
SELECT u.id, 'Dr. Jonathan Lee', 'Family Medicine', NULL, 1
FROM users u
WHERE u.email = 'j.lee@chpoh.specialist'
  AND NOT EXISTS (SELECT 1 FROM doctor_profiles dp WHERE dp.user_id = u.id);

INSERT INTO doctor_profiles (user_id, full_name, specialty, clinic_id, specialist_id)
SELECT u.id, 'Dr. Melissa Tan', 'Pediatrics', NULL, 1
FROM users u
WHERE u.email = 'm.tan@chpoh.specialist'
  AND NOT EXISTS (SELECT 1 FROM doctor_profiles dp WHERE dp.user_id = u.id);

INSERT INTO doctor_profiles (user_id, full_name, specialty, clinic_id, specialist_id)
SELECT u.id, 'Dr. Aaron Ng', 'Internal Medicine', NULL, 2
FROM users u
WHERE u.email = 'aar.ng@chpoh.specialist'
  AND NOT EXISTS (SELECT 1 FROM doctor_profiles dp WHERE dp.user_id = u.id);

INSERT INTO doctor_profiles (user_id, full_name, specialty, clinic_id, specialist_id)
SELECT u.id, 'Dr. Grace Chew', 'Dermatology', NULL, 2
FROM users u
WHERE u.email = 'g.chew@chpoh.specialist'
  AND NOT EXISTS (SELECT 1 FROM doctor_profiles dp WHERE dp.user_id = u.id);

COMMIT;