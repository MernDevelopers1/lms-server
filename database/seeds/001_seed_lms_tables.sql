USE school_lms;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE audit_logs;
TRUNCATE TABLE zoom_settings;
TRUNCATE TABLE announcements;
TRUNCATE TABLE notifications;
TRUNCATE TABLE payments;
TRUNCATE TABLE fee_vouchers;
TRUNCATE TABLE fee_structures;
TRUNCATE TABLE live_class_attendance;
TRUNCATE TABLE live_classes;
TRUNCATE TABLE documents;
TRUNCATE TABLE exam_results;
TRUNCATE TABLE exams;
TRUNCATE TABLE quiz_results;
TRUNCATE TABLE quiz_options;
TRUNCATE TABLE quiz_questions;
TRUNCATE TABLE quizzes;
TRUNCATE TABLE assignment_submissions;
TRUNCATE TABLE assignments;
TRUNCATE TABLE attendance;
TRUNCATE TABLE timetable;
TRUNCATE TABLE lecture_slots;
TRUNCATE TABLE rooms;
TRUNCATE TABLE student_subjects;
TRUNCATE TABLE teacher_subjects;
TRUNCATE TABLE student_parents;
TRUNCATE TABLE student_enrollments;
TRUNCATE TABLE subjects;
TRUNCATE TABLE sections;
TRUNCATE TABLE classes;
TRUNCATE TABLE academic_years;
TRUNCATE TABLE parent_profiles;
TRUNCATE TABLE student_profiles;
TRUNCATE TABLE teacher_profiles;
TRUNCATE TABLE role_permissions;
TRUNCATE TABLE user_roles;
TRUNCATE TABLE permissions;
TRUNCATE TABLE roles;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO users
  (id, first_name, last_name, email, password_hash, phone, profile_image, status, last_login)
VALUES
  (1, 'System', 'Admin', 'admin@school.test', '$2b$10$examplehashforlocaldevelopmentonly', '+920000000001', NULL, 'active', '2026-06-16 09:00:00'),
  (2, 'Ayesha', 'Khan', 'teacher@school.test', '$2b$10$examplehashforlocaldevelopmentonly', '+920000000002', NULL, 'active', '2026-06-16 09:10:00'),
  (3, 'Ali', 'Raza', 'student@school.test', '$2b$10$examplehashforlocaldevelopmentonly', '+920000000003', NULL, 'active', '2026-06-16 09:20:00'),
  (4, 'Sara', 'Raza', 'parent@school.test', '$2b$10$examplehashforlocaldevelopmentonly', '+920000000004', NULL, 'active', '2026-06-16 09:30:00');

INSERT INTO roles (id, name, description)
VALUES
  (1, 'Admin', 'Full system administrator'),
  (2, 'Teacher', 'Teacher user with academic management access'),
  (3, 'Student', 'Student user with learning access'),
  (4, 'Parent', 'Parent user with linked student access');

INSERT INTO permissions (id, name, module, description)
VALUES
  (1, 'manage_users', 'users', 'Create and manage users'),
  (2, 'manage_academics', 'academics', 'Manage classes, sections, and subjects'),
  (3, 'create_assignments', 'assignments', 'Create assignments'),
  (4, 'submit_assignments', 'assignments', 'Submit assignments'),
  (5, 'mark_attendance', 'attendance', 'Mark attendance'),
  (6, 'view_attendance', 'attendance', 'View attendance'),
  (7, 'create_live_classes', 'live_classes', 'Create live classes'),
  (8, 'view_child_progress', 'parents', 'View linked child progress');

INSERT INTO user_roles (user_id, role_id)
VALUES
  (1, 1),
  (2, 2),
  (3, 3),
  (4, 4);

INSERT INTO role_permissions (role_id, permission_id)
VALUES
  (1, 1),
  (1, 2),
  (1, 3),
  (1, 4),
  (1, 5),
  (1, 6),
  (1, 7),
  (1, 8),
  (2, 3),
  (2, 5),
  (2, 6),
  (2, 7),
  (3, 4),
  (3, 6),
  (4, 6),
  (4, 8);

INSERT INTO teacher_profiles
  (id, user_id, employee_no, designation, qualification, joining_date, address)
VALUES
  (1, 2, 'EMP-001', 'Mathematics Teacher', 'MSc Mathematics', '2024-08-01', 'Teacher Block, Main Campus');

INSERT INTO student_profiles
  (id, user_id, registration_no, admission_no, gender, date_of_birth, admission_date, address)
VALUES
  (1, 3, 'REG-2026-001', 'ADM-2026-001', 'male', '2012-04-12', '2026-04-01', 'Student House, City');

INSERT INTO parent_profiles
  (id, user_id, occupation, address)
VALUES
  (1, 4, 'Accountant', 'Parent House, City');

INSERT INTO academic_years (id, title, start_date, end_date, is_active)
VALUES
  (1, '2026-2027', '2026-04-01', '2027-03-31', true);

INSERT INTO classes (id, academic_year_id, name, description)
VALUES
  (1, 1, 'Grade 8', 'Grade 8 academic class');

INSERT INTO sections (id, class_id, name, capacity)
VALUES
  (1, 1, 'A', 35);

INSERT INTO subjects (id, code, name, description, total_marks, passing_marks)
VALUES
  (1, 'MATH-8', 'Mathematics', 'Grade 8 Mathematics', 100.00, 40.00);

INSERT INTO student_enrollments (id, student_id, section_id, enrollment_date, status)
VALUES
  (1, 1, 1, '2026-04-01', 'active');

INSERT INTO student_parents (student_id, parent_id, relationship)
VALUES
  (1, 1, 'Mother');

INSERT INTO teacher_subjects (teacher_id, subject_id, section_id)
VALUES
  (1, 1, 1);

INSERT INTO student_subjects (student_id, subject_id, section_id)
VALUES
  (1, 1, 1);

INSERT INTO rooms (id, room_no, room_name, building, capacity)
VALUES
  (1, 'R-101', 'Mathematics Room', 'Academic Block', 35);

INSERT INTO lecture_slots (id, title, start_time, end_time)
VALUES
  (1, 'Period 1', '08:00:00', '08:45:00');

INSERT INTO timetable (id, section_id, subject_id, teacher_id, room_id, lecture_slot_id, day_of_week)
VALUES
  (1, 1, 1, 1, 1, 1, 1);

INSERT INTO attendance (id, student_id, subject_id, teacher_id, attendance_date, status, remarks)
VALUES
  (1, 1, 1, 1, '2026-06-16', 'present', 'Seed attendance record');

INSERT INTO assignments
  (id, subject_id, teacher_id, title, description, total_marks, due_date, attachment_url)
VALUES
  (1, 1, 1, 'Algebra Practice', 'Solve the first ten algebra questions.', 20.00, '2026-06-23 23:59:00', '/uploads/assignments/algebra-practice.pdf');

INSERT INTO assignment_submissions
  (assignment_id, student_id, file_url, submitted_at, marks_obtained, feedback, status)
VALUES
  (1, 1, '/uploads/submissions/algebra-practice-ali.pdf', '2026-06-17 10:00:00', 18.00, 'Good work.', 'graded');

INSERT INTO quizzes
  (id, subject_id, teacher_id, title, instructions, total_marks, start_time, end_time)
VALUES
  (1, 1, 1, 'Algebra Quiz', 'Choose the correct answer.', 10.00, '2026-06-18 09:00:00', '2026-06-18 09:20:00');

INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, marks)
VALUES
  (1, 1, 'What is 2 + 2?', 'single_choice', 2.00);

INSERT INTO quiz_options (id, question_id, option_text, is_correct)
VALUES
  (1, 1, '3', false),
  (2, 1, '4', true);

INSERT INTO quiz_results (quiz_id, student_id, score, submitted_at, time_taken)
VALUES
  (1, 1, 8.00, '2026-06-18 09:15:00', 900);

INSERT INTO exams
  (id, subject_id, title, description, exam_date, total_marks, passing_marks)
VALUES
  (1, 1, 'Midterm Mathematics', 'Grade 8 midterm mathematics exam.', '2026-08-15', 100.00, 40.00);

INSERT INTO exam_results
  (exam_id, student_id, marks_obtained, percentage, grade, remarks)
VALUES
  (1, 1, 86.00, 86.00, 'A', 'Strong performance.');

INSERT INTO documents
  (id, subject_id, teacher_id, title, description, file_url, file_type, uploaded_at)
VALUES
  (1, 1, 1, 'Algebra Notes', 'Chapter notes for algebra.', '/uploads/documents/algebra-notes.pdf', 'pdf', '2026-06-16 11:00:00');

INSERT INTO live_classes
  (id, section_id, subject_id, teacher_id, title, description, zoom_meeting_id, zoom_join_url, zoom_start_url, start_time, duration_minutes, recording_url, status)
VALUES
  (1, 1, 1, 1, 'Live Algebra Class', 'Introduction to linear equations.', '9876543210', 'https://zoom.us/j/9876543210', 'https://zoom.us/s/9876543210', '2026-06-19 10:00:00', 45, NULL, 'scheduled');

INSERT INTO live_class_attendance
  (live_class_id, student_id, joined_at, left_at, attendance_status, duration_minutes)
VALUES
  (1, 1, '2026-06-19 10:01:00', '2026-06-19 10:44:00', 'present', 43);

INSERT INTO fee_structures
  (id, class_id, title, amount, frequency, description)
VALUES
  (1, 1, 'Monthly Tuition Fee', 5000.00, 'monthly', 'Monthly tuition fee for Grade 8');

INSERT INTO fee_vouchers
  (id, student_id, fee_structure_id, voucher_no, issue_date, due_date, amount, discount, fine, status)
VALUES
  (1, 1, 1, 'VCH-2026-0001', '2026-06-01', '2026-06-10', 5000.00, 0.00, 0.00, 'paid');

INSERT INTO payments
  (id, voucher_id, amount_paid, payment_method, transaction_reference, payment_date, remarks)
VALUES
  (1, 1, 5000.00, 'cash', 'CASH-2026-0001', '2026-06-05', 'Paid at school office');

INSERT INTO notifications
  (id, user_id, title, message, type, is_read, sent_at)
VALUES
  (1, 3, 'Assignment Posted', 'A new Mathematics assignment has been posted.', 'assignment', false, '2026-06-16 12:00:00');

INSERT INTO announcements
  (id, created_by, title, description, audience_type, publish_date, expiry_date)
VALUES
  (1, 1, 'Welcome Back', 'Welcome to the 2026-2027 academic year.', 'all', '2026-04-01 08:00:00', '2026-04-30 23:59:00');

INSERT INTO zoom_settings
  (id, account_email, client_id, client_secret, webhook_secret)
VALUES
  (1, 'zoom-admin@school.test', 'replace-with-client-id', 'replace-with-client-secret', 'replace-with-webhook-secret');

INSERT INTO audit_logs
  (id, user_id, module, action, record_id, old_values, new_values, ip_address)
VALUES
  (1, 1, 'seed', 'insert', 'initial-data', NULL, JSON_OBJECT('status', 'seeded'), '127.0.0.1');
