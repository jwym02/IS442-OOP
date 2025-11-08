-- Admin Hash, password is admintest
UPDATE users SET password_hash = '$2a$10$0XZlmLEBxBHvliqn2vzLRONfeUpMT0mVyvin3uDFULvBOULHUjXri'
WHERE email = 'alice.admin@demo.clinic';

-- Staff Hash, password is stafftest
UPDATE users SET password_hash = '$2a$10$QFr5xDwJcF0Ln6me3zHhlunY9Vv./uNlKyXPrc6KGDOACOaNpEvB2'
WHERE email IN ('sam.staff@evergreen.clinic', 'nora.nurse@sunrise.clinic');

-- Doctor Hash, password is doctortest
UPDATE users SET password_hash = '$2a$10$Zz3gKcPgvpEBRvIUj/9dGuioWyhrc4pdazVephs8qAH90u1KZt94K'
WHERE email IN (
  'd.tan@evergreen.clinic',
  'e.koh@evergreen.clinic',
  'f.rahman@sunrise.clinic',
  'g.lim@lakeside.clinic'
);

-- Patient Hash, password is patienttest
UPDATE users SET password_hash = '$2a$10$10sJpob0B/lsHABAHiKJgOFN2/JjKZDyvSqOVcuJKVmDuSPbMBdM6'
WHERE email IN (
  'peter.patient@example.com',
  'jiaying.patient@example.com',
  'rahul.patient@example.com',
  'siti.patient@example.com',
  'marcus.patient@example.com',
  'chloe.patient@example.com'
);
