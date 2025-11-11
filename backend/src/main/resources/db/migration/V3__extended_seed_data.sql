-- Additional time slots for 22 Oct 2025
INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-10-22 11:00:00', '2025-10-22 11:15:00', TRUE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'd.tan@evergreen.clinic'
WHERE NOT EXISTS (
    SELECT 1 FROM time_slots t
    WHERE t.schedule_id = s.id AND t.start_time = '2025-10-22 11:00:00'
);

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-10-22 11:15:00', '2025-10-22 11:30:00', TRUE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'e.koh@evergreen.clinic'
WHERE NOT EXISTS (
    SELECT 1 FROM time_slots t
    WHERE t.schedule_id = s.id AND t.start_time = '2025-10-22 11:15:00'
);

-- New sample appointments across clinics
INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-10-22 11:00:00', 'SCHEDULED', d.clinic_id, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'd.tan@evergreen.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000001','-',''))
WHERE NOT EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.date_time = '2025-10-22 11:00:00'
      AND a.doctor_id = d.id
      AND a.patient_id = p.id
);

INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-09-30 09:00:00', 'COMPLETED', d.clinic_id, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'f.rahman@sunrise.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000003','-',''))
WHERE NOT EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.date_time = '2025-09-30 09:00:00'
      AND a.doctor_id = d.id
      AND a.patient_id = p.id
);

INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-09-30 09:30:00', 'CANCELLED', d.clinic_id, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'f.rahman@sunrise.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000004','-',''))
WHERE NOT EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.date_time = '2025-09-30 09:30:00'
      AND a.doctor_id = d.id
      AND a.patient_id = p.id
);

-- Queue session and sample entries for 22 Oct 2025
INSERT INTO queue_sessions (clinic_id, queue_date, state)
VALUES (1, '2025-10-22', 'ACTIVE')
ON DUPLICATE KEY UPDATE state = VALUES(state);

INSERT INTO queue_entries (clinic_id, queue_date, queue_number, status, appointment_id)
SELECT d.clinic_id, '2025-10-22', 12, 'WAITING', a.id
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN patient_profiles p ON p.id = a.patient_id
WHERE a.date_time = '2025-10-22 11:00:00'
  AND NOT EXISTS (
    SELECT 1 FROM queue_entries q
    WHERE q.clinic_id = d.clinic_id
      AND q.queue_date = '2025-10-22'
      AND q.queue_number = 12
  );

INSERT INTO queue_entries (clinic_id, queue_date, queue_number, status, appointment_id)
SELECT d.clinic_id, '2025-10-22', 13, 'CALLED', a.id
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN patient_profiles p ON p.id = a.patient_id
WHERE a.date_time = '2025-10-22 11:15:00'
  AND NOT EXISTS (
    SELECT 1 FROM queue_entries q
    WHERE q.clinic_id = d.clinic_id
      AND q.queue_date = '2025-10-22'
      AND q.queue_number = 13
  );

-- Notifications reflecting queue and follow-up events
INSERT INTO notifications (user_id, type, message, created_at)
SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000002','-','')),
       'QUEUE_CALLED',
       'Queue update: Please proceed to the counter for ticket #13.',
       '2025-10-22 11:10:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000002','-',''))
      AND n.message LIKE 'Queue update: Please proceed%'
);

INSERT INTO notifications (user_id, type, message, created_at)
SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000003','-','')),
       'REMINDER',
       'Follow-up review completed on 30 Sep 2025.',
       '2025-09-30 10:00:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000003','-',''))
      AND n.message LIKE 'Follow-up review completed on 30 Sep 2025.%'
);

-- Additional medical history records derived from completed appointments
INSERT INTO medical_records (patient_id, doctor_id, appointment_id, notes)
SELECT a.patient_id,
       a.doctor_id,
       a.id,
       'Dx: Type 2 Diabetes review. Rx: Adjusted Metformin dosage and scheduled quarterly follow-up.'
FROM appointments a
WHERE a.date_time = '2025-09-30 09:00:00'
  AND NOT EXISTS (
    SELECT 1 FROM medical_records m
    WHERE m.appointment_id = a.id
  );

INSERT INTO medical_records (patient_id, doctor_id, appointment_id, notes)
SELECT a.patient_id,
       a.doctor_id,
       a.id,
       'Dx: Viral pharyngitis resolved. Rx: Continue hydration, no further medication required.'
FROM appointments a
WHERE a.date_time = '2025-10-10 09:00:00'
  AND NOT EXISTS (
    SELECT 1 FROM medical_records m
    WHERE m.appointment_id = a.id
  );

-- ============================================= 
-- Project Presentation Seed Data
-- November 12, 2025 Afternoon Appointments (3PM - 5:30PM)
-- Clinic 1 (Evergreen Family Clinic)
-- ============================================= 

-- Time Slots for Dr. David Tan (Clinic 1)
INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 15:00:00', '2025-11-12 15:15:00', FALSE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'd.tan@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 15:00:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 15:15:00', '2025-11-12 15:30:00', TRUE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'd.tan@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 15:15:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 15:30:00', '2025-11-12 15:45:00', FALSE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'd.tan@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 15:30:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 15:45:00', '2025-11-12 16:00:00', FALSE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'd.tan@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 15:45:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 16:00:00', '2025-11-12 16:15:00', TRUE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'd.tan@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 16:00:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 16:15:00', '2025-11-12 16:30:00', FALSE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'd.tan@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 16:15:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 16:30:00', '2025-11-12 16:45:00', TRUE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'd.tan@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 16:30:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 16:45:00', '2025-11-12 17:00:00', FALSE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'd.tan@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 16:45:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 17:00:00', '2025-11-12 17:15:00', FALSE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'd.tan@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 17:00:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 17:15:00', '2025-11-12 17:30:00', TRUE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'd.tan@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 17:15:00');

-- Time Slots for Dr. Emily Koh (Clinic 1)
INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 15:00:00', '2025-11-12 15:15:00', FALSE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'e.koh@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 15:00:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 15:15:00', '2025-11-12 15:30:00', FALSE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'e.koh@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 15:15:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 15:30:00', '2025-11-12 15:45:00', TRUE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'e.koh@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 15:30:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 15:45:00', '2025-11-12 16:00:00', FALSE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'e.koh@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 15:45:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 16:00:00', '2025-11-12 16:15:00', FALSE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'e.koh@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 16:00:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 16:15:00', '2025-11-12 16:30:00', TRUE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'e.koh@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 16:15:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 16:30:00', '2025-11-12 16:45:00', FALSE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'e.koh@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 16:30:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 16:45:00', '2025-11-12 17:00:00', TRUE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'e.koh@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 16:45:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 17:00:00', '2025-11-12 17:15:00', FALSE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'e.koh@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 17:00:00');

INSERT INTO time_slots (schedule_id, start_time, end_time, available)
SELECT s.id, '2025-11-12 17:15:00', '2025-11-12 17:30:00', TRUE
FROM schedules s
JOIN doctor_profiles d ON d.id = s.doctor_id
JOIN users u ON u.id = d.user_id AND u.email = 'e.koh@evergreen.clinic'
WHERE NOT EXISTS (SELECT 1 FROM time_slots t WHERE t.schedule_id = s.id AND t.start_time = '2025-11-12 17:15:00');

-- Appointments for Dr. David Tan
INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-11-12 15:00:00', 'SCHEDULED', 1, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'd.tan@evergreen.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000007','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=1 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-11-12 15:00:00'
);

INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-11-12 15:30:00', 'SCHEDULED', 1, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'd.tan@evergreen.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000008','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=1 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-11-12 15:30:00'
);

INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-11-12 15:45:00', 'SCHEDULED', 1, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'd.tan@evergreen.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000009','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=1 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-11-12 15:45:00'
);

INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-11-12 16:15:00', 'SCHEDULED', 1, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'd.tan@evergreen.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000010','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=1 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-11-12 16:15:00'
);

INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-11-12 16:45:00', 'SCHEDULED', 1, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'd.tan@evergreen.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000011','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=1 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-11-12 16:45:00'
);

INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-11-12 17:00:00', 'SCHEDULED', 1, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'd.tan@evergreen.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000012','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=1 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-11-12 17:00:00'
);

-- Appointments for Dr. Emily Koh
INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-11-12 15:00:00', 'SCHEDULED', 1, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'e.koh@evergreen.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000013','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=1 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-11-12 15:00:00'
);

INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-11-12 15:15:00', 'SCHEDULED', 1, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'e.koh@evergreen.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000014','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=1 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-11-12 15:15:00'
);

INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-11-12 15:45:00', 'SCHEDULED', 1, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'e.koh@evergreen.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000015','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=1 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-11-12 15:45:00'
);

INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-11-12 16:00:00', 'SCHEDULED', 1, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'e.koh@evergreen.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000016','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=1 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-11-12 16:00:00'
);

INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-11-12 16:30:00', 'SCHEDULED', 1, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'e.koh@evergreen.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000017','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=1 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-11-12 16:30:00'
);

INSERT INTO appointments (date_time, status, clinic_id, doctor_id, patient_id)
SELECT '2025-11-12 17:00:00', 'SCHEDULED', 1, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'e.koh@evergreen.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000018','-',''))
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.clinic_id=1 AND a.doctor_id=d.id AND a.patient_id=p.id AND a.date_time='2025-11-12 17:00:00'
);

-- Queue Session for November 12, 2025
INSERT INTO queue_sessions (clinic_id, queue_date, state)
VALUES (1, '2025-11-12', 'ACTIVE')
ON DUPLICATE KEY UPDATE state = VALUES(state);

-- Queue entries for Dr. David Tan's patients
INSERT INTO queue_entries (clinic_id, queue_date, queue_number, status, appointment_id, created_at)
SELECT 1, '2025-11-12', 101, 'WAITING', a.id, '2025-11-12 14:55:00'
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN users du ON du.id = d.user_id AND du.email = 'd.tan@evergreen.clinic'
WHERE a.date_time = '2025-11-12 15:00:00' AND a.clinic_id = 1
AND NOT EXISTS (SELECT 1 FROM queue_entries q WHERE q.clinic_id=1 AND q.queue_date='2025-11-12' AND q.queue_number=101);

INSERT INTO queue_entries (clinic_id, queue_date, queue_number, status, appointment_id, created_at)
SELECT 1, '2025-11-12', 102, 'WAITING', a.id, '2025-11-12 15:25:00'
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN users du ON du.id = d.user_id AND du.email = 'd.tan@evergreen.clinic'
WHERE a.date_time = '2025-11-12 15:30:00' AND a.clinic_id = 1
AND NOT EXISTS (SELECT 1 FROM queue_entries q WHERE q.clinic_id=1 AND q.queue_date='2025-11-12' AND q.queue_number=102);

INSERT INTO queue_entries (clinic_id, queue_date, queue_number, status, appointment_id, created_at)
SELECT 1, '2025-11-12', 103, 'WAITING', a.id, '2025-11-12 15:40:00'
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN users du ON du.id = d.user_id AND du.email = 'd.tan@evergreen.clinic'
WHERE a.date_time = '2025-11-12 15:45:00' AND a.clinic_id = 1
AND NOT EXISTS (SELECT 1 FROM queue_entries q WHERE q.clinic_id=1 AND q.queue_date='2025-11-12' AND q.queue_number=103);

INSERT INTO queue_entries (clinic_id, queue_date, queue_number, status, appointment_id, created_at)
SELECT 1, '2025-11-12', 104, 'WAITING', a.id, '2025-11-12 16:10:00'
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN users du ON du.id = d.user_id AND du.email = 'd.tan@evergreen.clinic'
WHERE a.date_time = '2025-11-12 16:15:00' AND a.clinic_id = 1
AND NOT EXISTS (SELECT 1 FROM queue_entries q WHERE q.clinic_id=1 AND q.queue_date='2025-11-12' AND q.queue_number=104);

INSERT INTO queue_entries (clinic_id, queue_date, queue_number, status, appointment_id, created_at)
SELECT 1, '2025-11-12', 105, 'WAITING', a.id, '2025-11-12 16:40:00'
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN users du ON du.id = d.user_id AND du.email = 'd.tan@evergreen.clinic'
WHERE a.date_time = '2025-11-12 16:45:00' AND a.clinic_id = 1
AND NOT EXISTS (SELECT 1 FROM queue_entries q WHERE q.clinic_id=1 AND q.queue_date='2025-11-12' AND q.queue_number=105);

INSERT INTO queue_entries (clinic_id, queue_date, queue_number, status, appointment_id, created_at)
SELECT 1, '2025-11-12', 106, 'WAITING', a.id, '2025-11-12 16:55:00'
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN users du ON du.id = d.user_id AND du.email = 'd.tan@evergreen.clinic'
WHERE a.date_time = '2025-11-12 17:00:00' AND a.clinic_id = 1
AND NOT EXISTS (SELECT 1 FROM queue_entries q WHERE q.clinic_id=1 AND q.queue_date='2025-11-12' AND q.queue_number=106);

-- Queue entries for Dr. Emily Koh's patients
INSERT INTO queue_entries (clinic_id, queue_date, queue_number, status, appointment_id, created_at)
SELECT 1, '2025-11-12', 107, 'WAITING', a.id, '2025-11-12 14:50:00'
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN users du ON du.id = d.user_id AND du.email = 'e.koh@evergreen.clinic'
WHERE a.date_time = '2025-11-12 15:00:00' AND a.clinic_id = 1
AND NOT EXISTS (SELECT 1 FROM queue_entries q WHERE q.clinic_id=1 AND q.queue_date='2025-11-12' AND q.queue_number=107);

INSERT INTO queue_entries (clinic_id, queue_date, queue_number, status, appointment_id, created_at)
SELECT 1, '2025-11-12', 108, 'WAITING', a.id, '2025-11-12 15:10:00'
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN users du ON du.id = d.user_id AND du.email = 'e.koh@evergreen.clinic'
WHERE a.date_time = '2025-11-12 15:15:00' AND a.clinic_id = 1
AND NOT EXISTS (SELECT 1 FROM queue_entries q WHERE q.clinic_id=1 AND q.queue_date='2025-11-12' AND q.queue_number=108);

INSERT INTO queue_entries (clinic_id, queue_date, queue_number, status, appointment_id, created_at)
SELECT 1, '2025-11-12', 109, 'WAITING', a.id, '2025-11-12 15:40:00'
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN users du ON du.id = d.user_id AND du.email = 'e.koh@evergreen.clinic'
WHERE a.date_time = '2025-11-12 15:45:00' AND a.clinic_id = 1
AND NOT EXISTS (SELECT 1 FROM queue_entries q WHERE q.clinic_id=1 AND q.queue_date='2025-11-12' AND q.queue_number=109);

INSERT INTO queue_entries (clinic_id, queue_date, queue_number, status, appointment_id, created_at)
SELECT 1, '2025-11-12', 110, 'WAITING', a.id, '2025-11-12 15:55:00'
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN users du ON du.id = d.user_id AND du.email = 'e.koh@evergreen.clinic'
WHERE a.date_time = '2025-11-12 16:00:00' AND a.clinic_id = 1
AND NOT EXISTS (SELECT 1 FROM queue_entries q WHERE q.clinic_id=1 AND q.queue_date='2025-11-12' AND q.queue_number=110);

INSERT INTO queue_entries (clinic_id, queue_date, queue_number, status, appointment_id, created_at)
SELECT 1, '2025-11-12', 111, 'WAITING', a.id, '2025-11-12 16:25:00'
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN users du ON du.id = d.user_id AND du.email = 'e.koh@evergreen.clinic'
WHERE a.date_time = '2025-11-12 16:30:00' AND a.clinic_id = 1
AND NOT EXISTS (SELECT 1 FROM queue_entries q WHERE q.clinic_id=1 AND q.queue_date='2025-11-12' AND q.queue_number=111);

INSERT INTO queue_entries (clinic_id, queue_date, queue_number, status, appointment_id, created_at)
SELECT 1, '2025-11-12', 112, 'WAITING', a.id, '2025-11-12 16:55:00'
FROM appointments a
JOIN doctor_profiles d ON d.id = a.doctor_id
JOIN users du ON du.id = d.user_id AND du.email = 'e.koh@evergreen.clinic'
WHERE a.date_time = '2025-11-12 17:00:00' AND a.clinic_id = 1
AND NOT EXISTS (SELECT 1 FROM queue_entries q WHERE q.clinic_id=1 AND q.queue_date='2025-11-12' AND q.queue_number=112);

-- Notifications for November 12, 2025
INSERT INTO notifications (user_id, type, message, created_at, read_flag)
SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000007','-','')), 'APPT_CONFIRMATION', 'Your appointment is confirmed for 12 Nov 2025, 3:00 PM with Dr. David Tan.', '2025-11-11 10:00:00', FALSE
FROM dual
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n WHERE n.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000007','-','')) AND n.created_at = '2025-11-11 10:00:00'
);

INSERT INTO notifications (user_id, type, message, created_at, read_flag)
SELECT UNHEX(REPLACE('d0000000-0000-0000-0000-000000000013','-','')), 'REMINDER', 'Reminder: Your appointment is today at 3:00 PM with Dr. Emily Koh.', '2025-11-12 09:00:00', FALSE
FROM dual
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n WHERE n.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000013','-','')) AND n.created_at = '2025-11-12 09:00:00'
);

INSERT INTO notifications (user_id, type, message, created_at, read_flag)
SELECT UNHEX(REPLACE('b0000000-0000-0000-0000-000000000001','-','')), 'QUEUE_UPDATE', 'Queue session active for Nov 12, 2025. Current queue: 12 patients.', '2025-11-12 14:30:00', FALSE
FROM dual
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n WHERE n.user_id = UNHEX(REPLACE('b0000000-0000-0000-0000-000000000001','-','')) AND n.created_at = '2025-11-12 14:30:00'
);

