-- V6: Add specialists table, rename speciality->specialty (non-destructive), add specialist users and link doctors to specialists.
-- Non-destructive: each DDL/DML guarded by existence checks.

START TRANSACTION;

-- 1) Create specialists table if it does not exist
CREATE TABLE IF NOT EXISTS `specialists` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `address` VARCHAR(1000) DEFAULT NULL,
  `phone` VARCHAR(255) DEFAULT NULL,
  `open_time` TIME DEFAULT NULL,
  `close_time` TIME DEFAULT NULL,
  `default_slot_interval_minutes` INT DEFAULT 15,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2) Rename column `speciality` -> `specialty` in doctor_profiles if needed (guarded)
SET @old_cnt := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'doctor_profiles' AND COLUMN_NAME = 'speciality');
SET @new_cnt := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'doctor_profiles' AND COLUMN_NAME = 'specialty');
SET @sql_stmt := IF(@old_cnt = 1 AND @new_cnt = 0,
                   "ALTER TABLE `doctor_profiles` CHANGE COLUMN `speciality` `specialty` VARCHAR(255);",
                   "SELECT 1");
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Ensure doctor_profiles has specialist_id column (some schemas may already have it)
SET @has_specid := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'doctor_profiles' AND COLUMN_NAME = 'specialist_id');
SET @sql_stmt := IF(@has_specid = 0,
                   "ALTER TABLE `doctor_profiles` ADD COLUMN `specialist_id` BIGINT DEFAULT NULL;",
                   "SELECT 1");
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4) Insert specialist users (id uses UUID_TO_BIN to produce binary(16)); no-op if email exists
INSERT INTO `users` (id, email, password_hash, enabled, created_at, full_name, phone_number)
SELECT UUID_TO_BIN(UUID()), 'j.lee@chpoh.specialist',
       '$2a$10$Zz3gKcPgvpEBRvIUj/9dGuioWyhrc4pdazVephs8qAH90u1KZt94K', 1, NOW(), 'Dr. Jonathan Lee', '+65 8000 0205'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'j.lee@chpoh.specialist');

INSERT INTO `users` (id, email, password_hash, enabled, created_at, full_name, phone_number)
SELECT UUID_TO_BIN(UUID()), 'm.tan@chpoh.specialist',
       '$2a$10$Zz3gKcPgvpEBRvIUj/9dGuioWyhrc4pdazVephs8qAH90u1KZt94K', 1, NOW(), 'Dr. Melissa Tan', '+65 8000 0206'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'm.tan@chpoh.specialist');

INSERT INTO `users` (id, email, password_hash, enabled, created_at, full_name, phone_number)
SELECT UUID_TO_BIN(UUID()), 'aar.ng@chpoh.specialist',
       '$2a$10$Zz3gKcPgvpEBRvIUj/9dGuioWyhrc4pdazVephs8qAH90u1KZt94K', 1, NOW(), 'Dr. Aaron Ng', '+65 8000 0207'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'aar.ng@chpoh.specialist');

INSERT INTO `users` (id, email, password_hash, enabled, created_at, full_name, phone_number)
SELECT UUID_TO_BIN(UUID()), 'g.chew@chpoh.specialist',
       '$2a$10$Zz3gKcPgvpEBRvIUj/9dGuioWyhrc4pdazVephs8qAH90u1KZt94K', 1, NOW(), 'Dr. Grace Chew', '+65 8000 0208'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'g.chew@chpoh.specialist');

-- 5) Insert specialists entries for the above doctors (idempotent)
INSERT INTO `specialists` (`name`, `address`, `phone`, `open_time`, `close_time`, `default_slot_interval_minutes`)
SELECT 'CH POH DIGESTIVE & LIVER CLINIC PTE', 'LTD 38 IRRAWADDY ROAD #09-46 MOUNT ELIZABETH NOVENA SINGAPORE 329563', '66946988', '08:30:00', '17:00:00', 15
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM specialists WHERE name = 'CH POH DIGESTIVE & LIVER CLINIC PTE');

INSERT INTO `specialists` (`name`, `address`, `phone`, `open_time`, `close_time`, `default_slot_interval_minutes`)
SELECT 'NOVENA SPECIALIST CENTRE SINGAPORE 329563', 'CENTRAL NOVENA ISLAND ORTHOPAEDIC CONSULTANTS PTE LTD (MT E NOVENA) 38 IRRAWADDY ROAD #05-42 MOUNT E', '63520529', '09:00:00', '17:00:00', 15
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM specialists WHERE name = 'NOVENA SPECIALIST CENTRE SINGAPORE 329563');

-- 6) Link doctor_profiles to specialists:
-- For doctors whose full_name matches, set specialist_id to the matching specialist.id (only when null)
UPDATE `doctor_profiles` dp
JOIN `specialists` s ON s.name LIKE '%DIGESTIVE & LIVER%'  -- adjust matching logic as needed
SET dp.specialist_id = s.id
WHERE dp.full_name = 'Dr. Jonathan Lee' AND (dp.specialist_id IS NULL OR dp.specialist_id = 0);

UPDATE `doctor_profiles` dp
JOIN `specialists` s ON s.name LIKE '%NOVENA SPECIALIST CENTRE%'
SET dp.specialist_id = s.id
WHERE dp.full_name IN ('Dr. Aaron Ng','Dr. Melissa Tan','Dr. Grace Chew') AND (dp.specialist_id IS NULL OR dp.specialist_id = 0);

-- 7) Add foreign key constraint doctor_profiles.specialist_id -> specialists.id if not present
SET @fk_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                   JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                     ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
                   WHERE tc.CONSTRAINT_SCHEMA = DATABASE()
                     AND tc.TABLE_NAME = 'doctor_profiles'
                     AND kcu.COLUMN_NAME = 'specialist_id'
                     AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sql_stmt := IF(@fk_exists = 0,
                   "ALTER TABLE `doctor_profiles` ADD CONSTRAINT `fk_doctor_specialist` FOREIGN KEY (`specialist_id`) REFERENCES `specialists`(`id`);",
                   "SELECT 1");
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 8) Ensure appointments table has specialist_id column
SET @has_appt_specid := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND COLUMN_NAME = 'specialist_id');
SET @sql_stmt := IF(@has_appt_specid = 0,
                   "ALTER TABLE `appointments` ADD COLUMN `specialist_id` BIGINT DEFAULT NULL;",
                   "SELECT 1");
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 9) Add foreign key constraint appointments.specialist_id -> specialists.id if not present
SET @fk_exists2 := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                   JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                     ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
                   WHERE tc.CONSTRAINT_SCHEMA = DATABASE()
                     AND tc.TABLE_NAME = 'appointments'
                     AND kcu.COLUMN_NAME = 'specialist_id'
                     AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sql_stmt := IF(@fk_exists2 = 0,
                   "ALTER TABLE `appointments` ADD CONSTRAINT `fk_appointment_specialist` FOREIGN KEY (`specialist_id`) REFERENCES `specialists`(`id`);",
                   "SELECT 1");
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

COMMIT;

-- End of migration