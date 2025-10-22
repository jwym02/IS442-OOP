-- Align legacy notification rows with current enum values
UPDATE notifications
SET type = 'APPT_CONFIRMATION'
WHERE type = 'EMAIL';

UPDATE notifications
SET type = 'REMINDER'
WHERE type = 'SMS';

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
SELECT '2025-10-22 11:15:00', 'CHECKED_IN', d.clinic_id, d.id, p.id
FROM doctor_profiles d
JOIN users du ON du.id = d.user_id AND du.email = 'e.koh@evergreen.clinic'
JOIN patient_profiles p ON p.user_id = UNHEX(REPLACE('d0000000-0000-0000-0000-000000000002','-',''))
WHERE NOT EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.date_time = '2025-10-22 11:15:00'
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
