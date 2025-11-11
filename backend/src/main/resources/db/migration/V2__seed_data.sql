
-- Seed data adapted from provided seed.sql to current MySQL schema
-- Notes:
-- - Our DB is MySQL 8; ids are mostly AUTO_INCREMENT except users.id (BINARY(16))
-- - Roles are seeded here (PATIENT, CLINIC_STAFF, SYSTEM_ADMINISTRATOR)
-- - Doctor and staff use CLINIC_STAFF role in this app
-- - Idempotency: guarded with INSERT ... SELECT ... WHERE NOT EXISTS / ON DUPLICATE KEY

-- ============================================= 
-- Roles (idempotent upsert)
-- ============================================= 
INSERT INTO roles (name)
VALUES ('PATIENT'), ('CLINIC_STAFF'), ('SYSTEM_ADMINISTRATOR')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Initial 3 test clinics
INSERT INTO clinics (id, name, address, open_time, close_time, default_slot_interval_minutes)
VALUES
  (1, 'Evergreen Family Clinic', '123 Evergreen Ave, #01-01, Singapore', '09:00:00', '17:30:00', 15),
  (2, 'Sunrise Health GP',      '45 Sunrise Way, #02-10, Singapore',    '08:30:00', '17:30:00', 15),
  (3, 'Lakeside Medical Centre', '8 Lakeside Dr, #03-05, Singapore',     '09:00:00', '18:00:00', 15)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  address = VALUES(address),
  open_time = VALUES(open_time),
  close_time = VALUES(close_time),
  default_slot_interval_minutes = VALUES(default_slot_interval_minutes);

-- Users
INSERT IGNORE INTO users (id, email, password_hash, enabled, created_at, full_name, phone_number)
VALUES
  (UNHEX(REPLACE('a0000000-0000-0000-0000-000000000001','-','')), 'alice.admin@demo.clinic',       'hash_admin',   TRUE, NOW(), 'Alice Admin',      '+65 8000 0001'),
  (UNHEX(REPLACE('b0000000-0000-0000-0000-000000000001','-','')), 'sam.staff@evergreen.clinic',    'hash_staff',   TRUE, NOW(), 'Sam Staff',        '+65 8000 0101'),
  (UNHEX(REPLACE('b0000000-0000-0000-0000-000000000002','-','')), 'nora.nurse@sunrise.clinic',     'hash_staff',   TRUE, NOW(), 'Nora Nurse',       '+65 8000 0102'),
  (UNHEX(REPLACE('c0000000-0000-0000-0000-000000000001','-','')), 'd.tan@evergreen.clinic',        'hash_doctor',  TRUE, NOW(), 'Dr. David Tan',    '+65 8000 0201'),
  (UNHEX(REPLACE('c0000000-0000-0000-0000-000000000002','-','')), 'e.koh@evergreen.clinic',        'hash_doctor',  TRUE, NOW(), 'Dr. Emily Koh',    '+65 8000 0202'),
  (UNHEX(REPLACE('c0000000-0000-0000-0000-000000000003','-','')), 'f.rahman@sunrise.clinic',       'hash_doctor',  TRUE, NOW(), 'Dr. Faisal Rahman','+65 8000 0203'),
  (UNHEX(REPLACE('c0000000-0000-0000-0000-000000000004','-','')), 'g.lim@lakeside.clinic',         'hash_doctor',  TRUE, NOW(), 'Dr. Grace Lim',    '+65 8000 0204'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000001','-','')), 'peter.patient@example.com',     'hash_patient', TRUE, NOW(), 'Peter Patient',    '+65 8000 0301'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000002','-','')), 'jiaying.patient@example.com',   'hash_patient', TRUE, NOW(), 'Jia Ying',         '+65 8000 0302'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000003','-','')), 'rahul.patient@example.com',     'hash_patient', TRUE, NOW(), 'Rahul Mehta',      '+65 8000 0303'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000004','-','')), 'siti.patient@example.com',      'hash_patient', TRUE, NOW(), 'Siti Aminah',      '+65 8000 0304'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000005','-','')), 'marcus.patient@example.com',    'hash_patient', TRUE, NOW(), 'Marcus Lee',       '+65 8000 0305'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000006','-','')), 'chloe.patient@example.com',     'hash_patient', TRUE, NOW(), 'Chloe Tan',        '+65 8000 0306'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000007','-','')), 'sarah.wong@example.com',        'hash_patient', TRUE, NOW(), 'Sarah Wong',       '+65 8000 0307'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000008','-','')), 'david.chen@example.com',        'hash_patient', TRUE, NOW(), 'David Chen',       '+65 8000 0308'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000009','-','')), 'linda.lim@example.com',         'hash_patient', TRUE, NOW(), 'Linda Lim',        '+65 8000 0309'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000010','-','')), 'robert.kumar@example.com',      'hash_patient', TRUE, NOW(), 'Robert Kumar',     '+65 8000 0310'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000011','-','')), 'emily.tan@example.com',         'hash_patient', TRUE, NOW(), 'Emily Tan',        '+65 8000 0311'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000012','-','')), 'michael.ng@example.com',        'hash_patient', TRUE, NOW(), 'Michael Ng',       '+65 8000 0312'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000013','-','')), 'jane.seah@example.com',         'hash_patient', TRUE, NOW(), 'Jane Seah',        '+65 8000 0313'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000014','-','')), 'william.goh@example.com',       'hash_patient', TRUE, NOW(), 'William Goh',      '+65 8000 0314'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000015','-','')), 'jessica.ong@example.com',       'hash_patient', TRUE, NOW(), 'Jessica Ong',      '+65 8000 0315'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000016','-','')), 'daniel.yeo@example.com',        'hash_patient', TRUE, NOW(), 'Daniel Yeo',       '+65 8000 0316'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000017','-','')), 'rachel.chua@example.com',       'hash_patient', TRUE, NOW(), 'Rachel Chua',      '+65 8000 0317'),
  (UNHEX(REPLACE('d0000000-0000-0000-0000-000000000018','-','')), 'kevin.poh@example.com',         'hash_patient', TRUE, NOW(), 'Kevin Poh',        '+65 8000 0318');

-- User Roles
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT UNHEX(REPLACE('a0000000-0000-0000-0000-000000000001','-','')), r.id
FROM roles r WHERE r.name = 'SYSTEM_ADMINISTRATOR';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM roles r
JOIN (
  SELECT UNHEX(REPLACE('b0000000-0000-0000-0000-000000000001','-','')) AS id UNION ALL
  SELECT UNHEX(REPLACE('b0000000-0000-0000-0000-000000000002','-','')) UNION ALL
  SELECT UNHEX(REPLACE('c0000000-0000-0000-0000-000000000001','-','')) UNION ALL
  SELECT UNHEX(REPLACE('c0000000-0000-0000-0000-000000000002','-','')) UNION ALL
  SELECT UNHEX(REPLACE('c0000000-0000-0000-0000-000000000003','-','')) UNION ALL
  SELECT UNHEX(REPLACE('c0000000-0000-0000-0000-000000000004','-',''))
) u ON 1=1
WHERE r.name = 'CLINIC_STAFF';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM roles r
JOIN (
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000001','-','')) AS id UNION ALL
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000002','-','')) UNION ALL
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000003','-','')) UNION ALL
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000004','-','')) UNION ALL
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000005','-','')) UNION ALL
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000006','-','')) UNION ALL
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000007','-','')) UNION ALL
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000008','-','')) UNION ALL
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000009','-','')) UNION ALL
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000010','-','')) UNION ALL
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000011','-','')) UNION ALL
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000012','-','')) UNION ALL
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000013','-','')) UNION ALL
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000014','-','')) UNION ALL
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000015','-','')) UNION ALL
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000016','-','')) UNION ALL
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000017','-','')) UNION ALL
  SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000018','-',''))
) u ON 1=1
WHERE r.name = 'PATIENT';

-- Profiles
INSERT INTO admin_profiles (user_id, full_name)
SELECT u.id, u.full_name
FROM users u
WHERE u.email = 'alice.admin@demo.clinic'
AND NOT EXISTS (SELECT 1 FROM admin_profiles a WHERE a.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1990-01-15'
FROM users u
WHERE u.email = 'peter.patient@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1992-03-22'
FROM users u
WHERE u.email = 'jiaying.patient@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1988-07-10'
FROM users u
WHERE u.email = 'rahul.patient@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1995-11-05'
FROM users u
WHERE u.email = 'siti.patient@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1985-09-18'
FROM users u
WHERE u.email = 'marcus.patient@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1993-12-25'
FROM users u
WHERE u.email = 'chloe.patient@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1987-04-12'
FROM users u WHERE u.email = 'sarah.wong@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1991-08-25'
FROM users u WHERE u.email = 'david.chen@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1989-02-14'
FROM users u WHERE u.email = 'linda.lim@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1984-11-30'
FROM users u WHERE u.email = 'robert.kumar@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1994-06-18'
FROM users u WHERE u.email = 'emily.tan@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1986-09-22'
FROM users u WHERE u.email = 'michael.ng@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1990-01-08'
FROM users u WHERE u.email = 'jane.seah@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1983-05-16'
FROM users u WHERE u.email = 'william.goh@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1992-12-03'
FROM users u WHERE u.email = 'jessica.ong@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1988-07-27'
FROM users u WHERE u.email = 'daniel.yeo@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1993-03-11'
FROM users u WHERE u.email = 'rachel.chua@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO patient_profiles (user_id, full_name, birth_date)
SELECT u.id, u.full_name, '1985-10-29'
FROM users u WHERE u.email = 'kevin.poh@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles p WHERE p.user_id = u.id);

INSERT INTO clinic_staff_profiles (user_id, clinic_id, full_name)
SELECT u.id, c.id, u.full_name
FROM users u
JOIN clinics c ON (
  (u.email = 'sam.staff@evergreen.clinic' AND c.id = 1) OR
  (u.email = 'nora.nurse@sunrise.clinic'  AND c.id = 2)
)
WHERE NOT EXISTS (SELECT 1 FROM clinic_staff_profiles s WHERE s.user_id = u.id);

INSERT INTO doctor_profiles (user_id, full_name, specialty, clinic_id)
SELECT u.id, u.full_name,
       CASE u.email
         WHEN 'd.tan@evergreen.clinic'  THEN 'Family Medicine'
         WHEN 'e.koh@evergreen.clinic'  THEN 'Pediatrics'
         WHEN 'f.rahman@sunrise.clinic' THEN 'Internal Medicine'
         WHEN 'g.lim@lakeside.clinic'   THEN 'Dermatology'
         ELSE 'General'
       END,
       CASE u.email
         WHEN 'd.tan@evergreen.clinic'  THEN 1
         WHEN 'e.koh@evergreen.clinic'  THEN 1
         WHEN 'f.rahman@sunrise.clinic' THEN 2
         WHEN 'g.lim@lakeside.clinic'   THEN 3
         ELSE NULL
       END
FROM users u
WHERE u.email IN ('d.tan@evergreen.clinic','e.koh@evergreen.clinic','f.rahman@sunrise.clinic','g.lim@lakeside.clinic')
AND NOT EXISTS (SELECT 1 FROM doctor_profiles d WHERE d.user_id = u.id);

-- Schedules
INSERT INTO schedules (doctor_id, slot_interval_minutes)
SELECT d.id, 15
FROM doctor_profiles d
JOIN users u ON u.id = d.user_id
WHERE u.email IN ('d.tan@evergreen.clinic','e.koh@evergreen.clinic','f.rahman@sunrise.clinic','g.lim@lakeside.clinic')
AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.doctor_id = d.id);

-- Time slots for 2025-10-21
INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-10-21 09:00:00', '2025-10-21 09:15:00', TRUE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'd.tan@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-10-21 09:00:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-10-21 09:15:00', '2025-10-21 09:30:00', FALSE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'd.tan@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-10-21 09:15:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-10-21 09:30:00', '2025-10-21 09:45:00', TRUE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'd.tan@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-10-21 09:30:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-10-21 10:00:00', '2025-10-21 10:15:00', FALSE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'e.koh@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-10-21 10:00:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-10-21 10:15:00', '2025-10-21 10:30:00', TRUE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'e.koh@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-10-21 10:15:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-10-21 09:00:00', '2025-10-21 09:15:00', TRUE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'f.rahman@sunrise.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-10-21 09:00:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-10-21 09:15:00', '2025-10-21 09:30:00', FALSE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'f.rahman@sunrise.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-10-21 09:15:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-10-21 11:00:00', '2025-10-21 11:20:00', TRUE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'g.lim@lakeside.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-10-21 11:00:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-10-21 11:20:00', '2025-10-21 11:40:00', FALSE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'g.lim@lakeside.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-10-21 11:20:00');

-- Appointments
INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-10-21 09:15:00', 'SCHEDULED', 1, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'd.tan@evergreen.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000001','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=1 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-10-21 09:15:00'
);

INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-10-21 10:00:00', 'SCHEDULED', 1, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'e.koh@evergreen.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000002','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=1 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-10-21 10:00:00'
);

INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-10-21 09:15:00', 'SCHEDULED', 2, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'f.rahman@sunrise.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000003','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=2 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-10-21 09:15:00'
);

INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-10-21 11:20:00', 'SCHEDULED', 3, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'g.lim@lakeside.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000004','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=3 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-10-21 11:20:00'
);

-- Historical
INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-10-10 09:00:00', 'COMPLETED', 1, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'd.tan@evergreen.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000005','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=1 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-10-10 09:00:00'
);

INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-10-12 09:00:00', 'CANCELLED', 2, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'f.rahman@sunrise.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000006','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=2 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-10-12 09:00:00'
);

-- Queue entries (today)
INSERT INTO queue_entries (clinic_id, queue_date, queue_number, status, appointment_id, created_at)
SELECT 1, '2025-10-20', 1, 'WAITING', a.id, '2025-10-20 08:55:00'
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN users du ON du.id = d.user_id AND du.email = 'd.tan@evergreen.clinic'
JOIN patient_profiles p ON p.id = a.patient_id AND p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000001','-',''))
WHERE a.clinic_id = 1 AND a.date_time = '2025-10-21 09:15:00'
AND NOT EXISTS (
  SELECT 1 FROM queue_entries q WHERE q.clinic_id=1 AND q.queue_date='2025-10-20' AND q.queue_number=1
);

INSERT INTO queue_entries (clinic_id, queue_date, queue_number, status, appointment_id, created_at)
SELECT 1, '2025-10-20', 2, 'CALLED', a.id, '2025-10-20 09:05:00'
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN users du ON du.id = d.user_id AND du.email = 'e.koh@evergreen.clinic'
JOIN patient_profiles p ON p.id = a.patient_id AND p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000002','-',''))
WHERE a.clinic_id = 1 AND a.date_time = '2025-10-21 10:00:00'
AND NOT EXISTS (
  SELECT 1 FROM queue_entries q WHERE q.clinic_id=1 AND q.queue_date='2025-10-20' AND q.queue_number=2
);

INSERT INTO queue_entries (clinic_id, queue_date, queue_number, status, appointment_id, created_at)
SELECT 2, '2025-10-20', 1, 'WAITING', a.id, '2025-10-20 09:10:00'
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN users du ON du.id = d.user_id AND du.email = 'f.rahman@sunrise.clinic'
JOIN patient_profiles p ON p.id = a.patient_id AND p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000003','-',''))
WHERE a.clinic_id = 2 AND a.date_time = '2025-10-21 09:15:00'
AND NOT EXISTS (
  SELECT 1 FROM queue_entries q WHERE q.clinic_id=2 AND q.queue_date='2025-10-20' AND q.queue_number=1
);

-- Notifications
INSERT INTO notifications (user_id, type, message, created_at)
SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000001','-','')), 'APPT_CONFIRMATION', 'Your appointment is confirmed for 21 Oct 2025, 9:15 AM.', '2025-10-19 09:00:00'
FROM dual
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n WHERE n.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000001','-','')) AND n.message LIKE 'Your appointment is confirmed%'
);

INSERT INTO notifications (user_id, type, message, created_at)
SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000002','-','')), 'REMINDER', 'Reminder: appointment tomorrow at 10:00 AM.', '2025-10-20 09:00:00'
FROM dual
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n WHERE n.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000002','-','')) AND n.message LIKE 'Reminder: appointment tomorrow%'
);

INSERT INTO notifications (user_id, type, message, created_at)
SELECT UNHEX(REPLACE('b0000000-0000-0000-0000-000000000001','-','')), 'QUEUE_CALLED', 'Queue E-002 is ready. Please call next patient.', '2025-10-20 09:20:00'
FROM dual
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n WHERE n.user_id = UNHEX(REPLACE('b0000000-0000-0000-0000-000000000001','-','')) AND n.message LIKE 'Queue E-002 is ready%'
);

-- Medical Records
INSERT INTO medical_records (patient_id, doctor_id, appointment_id, notes)
SELECT p.id, d.id, a.id,
       'Dx: Viral URTI. Rx: Symptomatic relief, rest, fluids.'
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN users du ON du.id = d.user_id AND du.email = 'd.tan@evergreen.clinic'
JOIN patient_profiles p ON p.id = a.patient_id AND p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000005','-',''))
WHERE a.status = 'COMPLETED' AND a.date_time = '2025-10-10 09:00:00'
AND NOT EXISTS (
  SELECT 1 FROM medical_records m WHERE m.appointment_id = a.id
);


-- Additional clinics (4-100) with basic data
INSERT INTO clinics (id, name, address, phone, open_time, close_time, default_slot_interval_minutes) VALUES
    (4, 'Clinic 4', '618 YISHUN RING ROAD #01-3238, SINGAPORE, 760618', '62353490', '09:00:00', '17:00:00', 15),
    (5, 'Clinic 5', 'SINGAPORE 730888', '63688762', '09:00:00', '17:00:00', 15),
    (6, 'Clinic 6', '111 WOODLANDS STREET 13 #01-78, SINGAPORE 730111', '63627789', '09:00:00', '17:00:00', 15),
    (7, 'Clinic 7', 'POLYVIEW, SINGAPORE 520801', '62231070', '09:00:00', '17:00:00', 15),
    (8, 'Clinic 8', 'STATION, SINGAPORE 649846', '65159919', '09:00:00', '17:00:00', 15),
    (9, 'Clinic 9', 'SINGAPORE 460214', '64438077', '09:00:00', '17:00:00', 15),
    (10, 'Clinic 10', '64 YUNG KUANG ROAD #01-107, SINGAPORE 610064', '62656422', '09:00:00', '17:00:00', 15),
    (11, 'Clinic 11', '38 TEBAN GARDENS ROAD #01-318, SINGAPORE 600038', '65619366', '09:00:00', '17:00:00', 15),
    (12, 'Clinic 12', '1 JURONG WEST CENTRAL 2 #B1A-19E JURONG POINT SHOPPING CENTRE JP1, SINGAPORE 648886', '67923822', '09:00:00', '17:00:00', 15),
    (13, 'Clinic 13', '215C COMPASSVALE DRIVE #01-02, SINGAPORE 543215', '63850113', '09:00:00', '17:00:00', 15),
    (14, 'Clinic 14', '7 WALLICH STREET #B1-15 GUOCO TOWER, SINGAPORE 078884', '63868980', '09:00:00', '17:00:00', 15),
    (15, 'Clinic 15', '71 PIONEER ROAD #01-06 TUAS AMENITY CENTRE, SINGAPORE 639591', '68615996', '09:00:00', '17:00:00', 15),
    (16, 'Clinic 16', '1 JOO KOON CIRCLE #01-23 FAIRPRICE HUB, SINGAPORE 629117', '68615755', '09:00:00', '17:00:00', 15),
    (17, 'Clinic 17', '253 SERANGOON CENTRAL DRIVE #01-187, SINGAPORE 550253', '62808080', '09:00:00', '17:00:00', 15),
    (18, 'Clinic 18', '370 TANJONG KATONG ROAD, SINGAPORE 437127', '63457810', '09:00:00', '17:00:00', 15),
    (19, 'Clinic 19', '221 BALESTIER RD #02-06, SINGAPORE 329928', '60254975', '09:00:00', '17:00:00', 15),
    (20, 'Clinic 20', '709 ANG MO KIO AVENUE 8 #01-2583, SINGAPORE 560709', '64286084', '09:00:00', '17:00:00', 15),
    (21, 'Clinic 21', '152 BEACH ROAD #03-08 GATEWAY EAST, SINGAPORE 189721', '62995398', '09:00:00', '17:00:00', 15),
    (22, 'Clinic 22', '601 MACPHERSON ROAD #01-03/04 GRANTRAL COMPLEX, SINGAPORE 368242', '69046678', '09:00:00', '17:00:00', 15),
    (23, 'Clinic 23', '38 MARGARET DRIVE #02-01, SINGAPORE 141038', '63223886', '09:00:00', '17:00:00', 15),
    (24, 'Clinic 24', '858 WOODLANDS DRIVE 50 #01-739 888 PLAZA, SINGAPORE 730888', '63688762', '09:00:00', '17:00:00', 15),
    (25, 'Clinic 25', '111 WOODLANDS STREET 13 #01-78, SINGAPORE 730111', '63627789', '09:00:00', '17:00:00', 15),
    (26, 'Clinic 26', '801 TAMPINES AVENUE 4 #01-269 TAMPINES, SINGAPORE 520801', '62231070', '09:00:00', '17:00:00', 15),
    (27, 'Clinic 27', '301 BOON LAY WAY #01-18/19 BOON LAY MRT STATION, SINGAPORE 649846', '65159919', '09:00:00', '17:00:00', 15),
    (28, 'Clinic 28', '214 BEDOK NORTH STREET 1 #01-165, SINGAPORE 460214', '64438077', '09:00:00', '17:00:00', 15),
    (29, 'Clinic 29', '64 YUNG KUANG ROAD #01-107, SINGAPORE 610064', '62656422', '09:00:00', '17:00:00', 15),
    (30, 'Clinic 30', '38 TEBAN GARDENS ROAD #01-318, SINGAPORE 600038', '65619366', '09:00:00', '17:00:00', 15),
    (31, 'Clinic 31', '1 JURONG WEST CENTRAL 2 #B1A-19E JURONG POINT SHOPPING CENTRE JP1, SINGAPORE 648886', '67923822', '09:00:00', '17:00:00', 15),
    (32, 'Clinic 32', '215C COMPASSVALE DRIVE #01-02, SINGAPORE 543215', '63850113', '09:00:00', '17:00:00', 15),
    (33, 'Clinic 33', '7 WALLICH STREET #B1-15 GUOCO TOWER, SINGAPORE 078884', '63868980', '09:00:00', '17:00:00', 15),
    (34, 'Clinic 34', '71 PIONEER ROAD #01-06 TUAS AMENITY CENTRE, SINGAPORE 639591', '68615996', '09:00:00', '17:00:00', 15),
    (35, 'Clinic 35', '1 JOO KOON CIRCLE #01-23 FAIRPRICE HUB, SINGAPORE 629117', '68615755', '09:00:00', '17:00:00', 15),
    (36, 'Clinic 36', '253 SERANGOON CENTRAL DRIVE #01-187, SINGAPORE 550253', '62808080', '09:00:00', '17:00:00', 15),
    (37, 'Clinic 37', '370 TANJONG KATONG ROAD, SINGAPORE 437127', '63457810', '09:00:00', '17:00:00', 15),
    (38, 'Clinic 38', '221 BALESTIER RD #02-06, SINGAPORE 329928', '60254975', '09:00:00', '17:00:00', 15),
    (39, 'Clinic 39', '709 ANG MO KIO AVENUE 8 #01-2583, SINGAPORE 560709', '64286084', '09:00:00', '17:00:00', 15),
    (40, 'Clinic 40', '152 BEACH ROAD #03-08 GATEWAY EAST, SINGAPORE 189721', '62995398', '09:00:00', '17:00:00', 15),
    (41, 'Clinic 41', '601 MACPHERSON ROAD #01-03/04 GRANTRAL COMPLEX, SINGAPORE 368242', '69046678', '09:00:00', '17:00:00', 15),
    (42, 'Clinic 42', '38 MARGARET DRIVE #02-01, SINGAPORE 141038', '63223886', '09:00:00', '17:00:00', 15),
    (43, 'Clinic 43', '57 GEYLANG BAHRU #01-3505, SINGAPORE, 330057', '66947078', '09:00:00', '17:00:00', 15),
    (44, 'Clinic 44', '32 CASSIA CRESCENT #01-62, SINGAPORE 390032', '65189262', '09:00:00', '17:00:00', 15),
    (45, 'Clinic 45', 'SINGAPORE 730166', '65399236', '09:00:00', '17:00:00', 15),
    (46, 'Clinic 46', '618 YISHUN RING ROAD #01-3238, SINGAPORE, 760618', '62353490', '09:00:00', '17:00:00', 15),
    (47, 'Clinic 47', 'SINGAPORE 730888', '63688762', '09:00:00', '17:00:00', 15),
    (48, 'Clinic 48', '111 WOODLANDS STREET 13 #01-78, SINGAPORE 730111', '63627789', '09:00:00', '17:00:00', 15),
    (49, 'Clinic 49', 'POLYVIEW, SINGAPORE 520801', '62231070', '09:00:00', '17:00:00', 15),
    (50, 'Clinic 50', 'STATION, SINGAPORE 649846', '65159919', '09:00:00', '17:00:00', 15),
    (51, 'Clinic 51', 'SINGAPORE 460214', '64438077', '09:00:00', '17:00:00', 15),
    (52, 'Clinic 52', '64 YUNG KUANG ROAD #01-107, SINGAPORE 610064', '62656422', '09:00:00', '17:00:00', 15),
    (53, 'Clinic 53', '38 TEBAN GARDENS ROAD #01-318, SINGAPORE 600038', '65619366', '09:00:00', '17:00:00', 15),
    (54, 'Clinic 54', '1 JURONG WEST CENTRAL 2 #B1A-19E JURONG POINT SHOPPING CENTRE JP1, SINGAPORE 648886', '67923822', '09:00:00', '17:00:00', 15),
    (55, 'Clinic 55', '215C COMPASSVALE DRIVE #01-02, SINGAPORE 543215', '63850113', '09:00:00', '17:00:00', 15),
    (56, 'Clinic 56', '7 WALLICH STREET #B1-15 GUOCO TOWER, SINGAPORE 078884', '63868980', '09:00:00', '17:00:00', 15),
    (57, 'Clinic 57', '71 PIONEER ROAD #01-06 TUAS AMENITY CENTRE, SINGAPORE 639591', '68615996', '09:00:00', '17:00:00', 15),
    (58, 'Clinic 58', '1 JOO KOON CIRCLE #01-23 FAIRPRICE HUB, SINGAPORE 629117', '68615755', '09:00:00', '17:00:00', 15),
    (59, 'Clinic 59', '253 SERANGOON CENTRAL DRIVE #01-187, SINGAPORE 550253', '62808080', '09:00:00', '17:00:00', 15),
    (60, 'Clinic 60', '370 TANJONG KATONG ROAD, SINGAPORE 437127', '63457810', '09:00:00', '17:00:00', 15),
    (61, 'Clinic 61', '221 BALESTIER RD #02-06, SINGAPORE 329928', '60254975', '09:00:00', '17:00:00', 15),
    (62, 'Clinic 62', '709 ANG MO KIO AVENUE 8 #01-2583, SINGAPORE 560709', '64286084', '09:00:00', '17:00:00', 15),
    (63, 'Clinic 63', '152 BEACH ROAD #03-08 GATEWAY EAST, SINGAPORE 189721', '62995398', '09:00:00', '17:00:00', 15),
    (64, 'Clinic 64', '601 MACPHERSON ROAD #01-03/04 GRANTRAL COMPLEX, SINGAPORE 368242', '69046678', '09:00:00', '17:00:00', 15),
    (65, 'Clinic 65', '38 MARGARET DRIVE #02-01, SINGAPORE 141038', '63223886', '09:00:00', '17:00:00', 15),
    (66, 'Clinic 66', '57 GEYLANG BAHRU #01-3505, SINGAPORE, 330057', '66947078', '09:00:00', '17:00:00', 15),
    (67, 'Clinic 67', '32 CASSIA CRESCENT #01-62, SINGAPORE 390032', '65189262', '09:00:00', '17:00:00', 15),
    (68, 'Clinic 68', 'SINGAPORE 730166', '65399236', '09:00:00', '17:00:00', 15),
    (69, 'Clinic 69', '618 YISHUN RING ROAD #01-3238, SINGAPORE, 760618', '62353490', '09:00:00', '17:00:00', 15),
    (70, 'Clinic 70', 'SINGAPORE 730888', '63688762', '09:00:00', '17:00:00', 15),
    (71, 'Clinic 71', '111 WOODLANDS STREET 13 #01-78, SINGAPORE 730111', '63627789', '09:00:00', '17:00:00', 15),
    (72, 'Clinic 72', 'POLYVIEW, SINGAPORE 520801', '62231070', '09:00:00', '17:00:00', 15),
    (73, 'Clinic 73', 'STATION, SINGAPORE 649846', '65159919', '09:00:00', '17:00:00', 15),
    (74, 'Clinic 74', 'SINGAPORE 460214', '64438077', '09:00:00', '17:00:00', 15),
    (75, 'Clinic 75', '64 YUNG KUANG ROAD #01-107, SINGAPORE 610064', '62656422', '09:00:00', '17:00:00', 15),
    (76, 'Clinic 76', '38 TEBAN GARDENS ROAD #01-318, SINGAPORE 600038', '65619366', '09:00:00', '17:00:00', 15),
    (77, 'Clinic 77', '1 JURONG WEST CENTRAL 2 #B1A-19E JURONG POINT SHOPPING CENTRE JP1, SINGAPORE 648886', '67923822', '09:00:00', '17:00:00', 15),
    (78, 'Clinic 78', '215C COMPASSVALE DRIVE #01-02, SINGAPORE 543215', '63850113', '09:00:00', '17:00:00', 15),
    (79, 'Clinic 79', '7 WALLICH STREET #B1-15 GUOCO TOWER, SINGAPORE 078884', '63868980', '09:00:00', '17:00:00', 15),
    (80, 'Clinic 80', '71 PIONEER ROAD #01-06 TUAS AMENITY CENTRE, SINGAPORE 639591', '68615996', '09:00:00', '17:00:00', 15),
    (81, 'Clinic 81', '1 JOO KOON CIRCLE #01-23 FAIRPRICE HUB, SINGAPORE 629117', '68615755', '09:00:00', '17:00:00', 15),
    (82, 'Clinic 82', '253 SERANGOON CENTRAL DRIVE #01-187, SINGAPORE 550253', '62808080', '09:00:00', '17:00:00', 15),
    (83, 'Clinic 83', '370 TANJONG KATONG ROAD, SINGAPORE 437127', '63457810', '09:00:00', '17:00:00', 15),
    (84, 'Clinic 84', '221 BALESTIER RD #02-06, SINGAPORE 329928', '60254975', '09:00:00', '17:00:00', 15),
    (85, 'Clinic 85', '709 ANG MO KIO AVENUE 8 #01-2583, SINGAPORE 560709', '64286084', '09:00:00', '17:00:00', 15),
    (86, 'Clinic 86', '152 BEACH ROAD #03-08 GATEWAY EAST, SINGAPORE 189721', '62995398', '09:00:00', '17:00:00', 15),
    (87, 'Clinic 87', '601 MACPHERSON ROAD #01-03/04 GRANTRAL COMPLEX, SINGAPORE 368242', '69046678', '09:00:00', '17:00:00', 15),
    (88, 'Clinic 88', '38 MARGARET DRIVE #02-01, SINGAPORE 141038', '63223886', '09:00:00', '17:00:00', 15),
    (89, 'Clinic 89', '57 GEYLANG BAHRU #01-3505, SINGAPORE, 330057', '66947078', '09:00:00', '17:00:00', 15),
    (90, 'Clinic 90', '32 CASSIA CRESCENT #01-62, SINGAPORE 390032', '65189262', '09:00:00', '17:00:00', 15),
    (91, 'Clinic 91', 'SINGAPORE 730166', '65399236', '09:00:00', '17:00:00', 15),
    (92, 'Clinic 92', '618 YISHUN RING ROAD #01-3238, SINGAPORE, 760618', '62353490', '09:00:00', '17:00:00', 15),
    (93, 'Clinic 93', 'SINGAPORE 730888', '63688762', '09:00:00', '17:00:00', 15),
    (94, 'Clinic 94', '111 WOODLANDS STREET 13 #01-78, SINGAPORE 730111', '63627789', '09:00:00', '17:00:00', 15),
    (95, 'Clinic 95', 'POLYVIEW, SINGAPORE 520801', '62231070', '09:00:00', '17:00:00', 15),
    (96, 'Clinic 96', 'STATION, SINGAPORE 649846', '65159919', '09:00:00', '17:00:00', 15),
    (97, 'Clinic 97', 'SINGAPORE 460214', '64438077', '09:00:00', '17:00:00', 15),
    (98, 'Clinic 98', '64 YUNG KUANG ROAD #01-107, SINGAPORE 610064', '62656422', '09:00:00', '17:00:00', 15),
    (99, 'Clinic 99', '38 TEBAN GARDENS ROAD #01-318, SINGAPORE 600038', '65619366', '09:00:00', '17:00:00', 15),
    (100, 'Clinic 100', '1 JURONG WEST CENTRAL 2 #B1A-19E JURONG POINT SHOPPING CENTRE JP1, SINGAPORE 648886', '67923822', '09:00:00', '17:00:00', 15)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  address = VALUES(address),
  phone = VALUES(phone),
  open_time = VALUES(open_time),
  close_time = VALUES(close_time),
  default_slot_interval_minutes = VALUES(default_slot_interval_minutes);
