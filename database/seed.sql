USE smart_campus_db;

INSERT INTO users (full_name, email, password, role) VALUES
('Admin User', 'admin@campus.com', '$2a$10$K8YbEQfQrQf7Lmx1yZ9E3OQJpG5y9jvhUY5UBO7bQnqh0Yy7JcK5K', 'admin'),
('Faculty User', 'faculty@campus.com', '$2a$10$K8YbEQfQrQf7Lmx1yZ9E3OQJpG5y9jvhUY5UBO7bQnqh0Yy7JcK5K', 'faculty'),
('Student User', 'student@campus.com', '$2a$10$K8YbEQfQrQf7Lmx1yZ9E3OQJpG5y9jvhUY5UBO7bQnqh0Yy7JcK5K', 'student');

INSERT INTO events (title, description, event_date, event_time, location, capacity, created_by, status) VALUES
('AI Workshop', 'Introduction to Artificial Intelligence and Machine Learning.', '2026-05-10', '14:00:00', 'Room A101', 50, 2, 'active'),
('Cybersecurity Seminar', 'A seminar about password security, phishing, and safe browsing.', '2026-05-15', '10:00:00', 'Auditorium Hall', 100, 2, 'active'),
('Career Fair', 'Campus career fair with company booths and networking sessions.', '2026-05-20', '09:00:00', 'Main Hall', 200, 2, 'active');

INSERT INTO resources (name, type, description, availability_status) VALUES
('Room A101', 'room', 'Lecture room with projector and 50 seats.', 'available'),
('Auditorium Hall', 'room', 'Large hall suitable for seminars and presentations.', 'available'),
('Projector Set 1', 'equipment', 'Portable projector and HDMI cable.', 'available'),
('Sound System', 'equipment', 'Microphone and speaker system.', 'available');

INSERT INTO registrations (user_id, event_id, status) VALUES
(3, 1, 'registered'),
(3, 2, 'registered');

INSERT INTO feedback (user_id, event_id, rating, comment) VALUES
(3, 1, 5, 'Very useful and well organized workshop.'),
(3, 2, 4, 'Good seminar with practical security advice.');

INSERT IGNORE INTO event_resources (event_id, resource_id) VALUES
(1, 1),
(1, 3),
(2, 2),
(2, 4);

INSERT INTO notifications (user_id, title, message) VALUES
(NULL, 'Welcome to Smart Campus Events', 'You can now browse and register for campus events.'),
(NULL, 'New Event Added', 'AI Workshop and Cybersecurity Seminar are now available.');