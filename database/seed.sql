-- ================================================================
-- seed.sql  — Initial starter accounts only (NO demo events)
-- ================================================================
-- Run this ONLY on a fresh database (after schema.sql).
-- It creates 3 default system accounts with real bcrypt hashes.
-- All events, resources, etc. must be created through the app UI.
--
-- Passwords:
--   admin@campus.com   → admin123
--   faculty@campus.com → faculty123
--   student@campus.com → student123
-- ================================================================
USE smart_campus_db;

INSERT IGNORE INTO users (full_name, email, password, role) VALUES
(
  'System Admin',
  'admin@campus.com',
  '$2b$10$xZm0l5y5UyHWKnzL/mBPK.z7NoT0BsP8PfIt3fUoqXivVVG9p.2yS',
  'admin'
),
(
  'Campus Faculty',
  'faculty@campus.com',
  '$2b$10$4QEG3uYuDzoGVzSrAFmiEOfCuAC.BnD3Xq8KFIe0ueD4W5fsgBhbK',
  'faculty'
),
(
  'Sample Student',
  'student@campus.com',
  '$2b$10$swna.mLSqSwI2G9NSzc9s.QnEN393uUybp3le.8HzDDkKCxLTUZsS',
  'student'
);

-- Welcome notification broadcast (shown to all users)
INSERT IGNORE INTO notifications (user_id, title, message)
VALUES (NULL, 'Welcome to CampusEvent', 'Your smart campus event management system is ready. Faculty can now create events for students to register.');