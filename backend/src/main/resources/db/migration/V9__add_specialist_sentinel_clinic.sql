-- ...existing code...
START TRANSACTION;

INSERT INTO clinics (id, name, address, phone, open_time, close_time, default_slot_interval_minutes)
VALUES (99999, 'SPECIALIST (no clinic)', 'External specialist / referral - no clinic', NULL, '00:00:00', '23:59:59', 15)
ON DUPLICATE KEY UPDATE name=VALUES(name), address=VALUES(address);

COMMIT;
-- ...existing code...