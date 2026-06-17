CREATE DATABASE IF NOT EXISTS school_lms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE school_lms;

CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone VARCHAR(30),
  profile_image TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  last_login DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', 'suspended'))
) ENGINE=InnoDB;

CREATE TABLE roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE permissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  module VARCHAR(100) NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT permissions_module_name_unique UNIQUE (module, name)
) ENGINE=InnoDB;

CREATE TABLE user_roles (
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT user_roles_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_roles_role_fk FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT role_permissions_role_fk FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT role_permissions_permission_fk FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE teacher_profiles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE,
  employee_no VARCHAR(100) NOT NULL UNIQUE,
  designation VARCHAR(150),
  qualification TEXT,
  joining_date DATE,
  address TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT teacher_profiles_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE student_profiles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE,
  registration_no VARCHAR(100) NOT NULL UNIQUE,
  admission_no VARCHAR(100) UNIQUE,
  gender VARCHAR(30),
  date_of_birth DATE,
  admission_date DATE,
  address TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT student_profiles_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT student_profiles_gender_check CHECK (gender IS NULL OR gender IN ('male', 'female', 'other'))
) ENGINE=InnoDB;

CREATE TABLE parent_profiles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE,
  occupation VARCHAR(150),
  address TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT parent_profiles_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE academic_years (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT academic_years_date_check CHECK (end_date > start_date)
) ENGINE=InnoDB;

CREATE TABLE classes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  academic_year_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT classes_academic_year_name_unique UNIQUE (academic_year_id, name),
  CONSTRAINT classes_academic_year_fk FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE sections (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  class_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  capacity INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT sections_class_name_unique UNIQUE (class_id, name),
  CONSTRAINT sections_class_fk FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT sections_capacity_check CHECK (capacity IS NULL OR capacity > 0)
) ENGINE=InnoDB;

CREATE TABLE subjects (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  total_marks DECIMAL(8,2) NOT NULL DEFAULT 100,
  passing_marks DECIMAL(8,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT subjects_marks_check CHECK (total_marks > 0 AND passing_marks >= 0 AND passing_marks <= total_marks)
) ENGINE=InnoDB;

CREATE TABLE student_enrollments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  student_id BIGINT NOT NULL,
  section_id BIGINT NOT NULL,
  enrollment_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT student_enrollments_student_section_unique UNIQUE (student_id, section_id),
  CONSTRAINT student_enrollments_student_fk FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  CONSTRAINT student_enrollments_section_fk FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE RESTRICT,
  CONSTRAINT student_enrollments_status_check CHECK (status IN ('active', 'inactive', 'transferred', 'graduated', 'withdrawn'))
) ENGINE=InnoDB;

CREATE TABLE student_parents (
  student_id BIGINT NOT NULL,
  parent_id BIGINT NOT NULL,
  relationship VARCHAR(80) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, parent_id),
  CONSTRAINT student_parents_student_fk FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  CONSTRAINT student_parents_parent_fk FOREIGN KEY (parent_id) REFERENCES parent_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE teacher_subjects (
  teacher_id BIGINT NOT NULL,
  subject_id BIGINT NOT NULL,
  section_id BIGINT NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (teacher_id, subject_id, section_id),
  CONSTRAINT teacher_subjects_teacher_fk FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  CONSTRAINT teacher_subjects_subject_fk FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT teacher_subjects_section_fk FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE student_subjects (
  student_id BIGINT NOT NULL,
  subject_id BIGINT NOT NULL,
  section_id BIGINT NOT NULL,
  enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, subject_id, section_id),
  CONSTRAINT student_subjects_student_fk FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  CONSTRAINT student_subjects_subject_fk FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT student_subjects_section_fk FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE rooms (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_no VARCHAR(50) NOT NULL UNIQUE,
  room_name VARCHAR(150),
  building VARCHAR(150),
  capacity INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rooms_capacity_check CHECK (capacity IS NULL OR capacity > 0)
) ENGINE=InnoDB;

CREATE TABLE lecture_slots (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT lecture_slots_time_check CHECK (end_time > start_time)
) ENGINE=InnoDB;

CREATE TABLE timetable (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  section_id BIGINT NOT NULL,
  subject_id BIGINT NOT NULL,
  teacher_id BIGINT NOT NULL,
  room_id BIGINT,
  lecture_slot_id BIGINT NOT NULL,
  day_of_week TINYINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT timetable_section_slot_unique UNIQUE (section_id, lecture_slot_id, day_of_week),
  CONSTRAINT timetable_teacher_slot_unique UNIQUE (teacher_id, lecture_slot_id, day_of_week),
  CONSTRAINT timetable_room_slot_unique UNIQUE (room_id, lecture_slot_id, day_of_week),
  CONSTRAINT timetable_section_fk FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  CONSTRAINT timetable_subject_fk FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
  CONSTRAINT timetable_teacher_fk FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE RESTRICT,
  CONSTRAINT timetable_room_fk FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  CONSTRAINT timetable_lecture_slot_fk FOREIGN KEY (lecture_slot_id) REFERENCES lecture_slots(id) ON DELETE RESTRICT,
  CONSTRAINT timetable_day_of_week_check CHECK (day_of_week BETWEEN 1 AND 7)
) ENGINE=InnoDB;

CREATE TABLE attendance (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  student_id BIGINT NOT NULL,
  subject_id BIGINT NOT NULL,
  teacher_id BIGINT NOT NULL,
  attendance_date DATE NOT NULL,
  status VARCHAR(30) NOT NULL,
  remarks TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT attendance_student_subject_date_unique UNIQUE (student_id, subject_id, attendance_date),
  CONSTRAINT attendance_student_fk FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  CONSTRAINT attendance_subject_fk FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
  CONSTRAINT attendance_teacher_fk FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE RESTRICT,
  CONSTRAINT attendance_status_check CHECK (status IN ('present', 'absent', 'late', 'excused'))
) ENGINE=InnoDB;

CREATE TABLE assignments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  subject_id BIGINT NOT NULL,
  teacher_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  total_marks DECIMAL(8,2) NOT NULL DEFAULT 0,
  due_date DATETIME,
  attachment_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT assignments_subject_fk FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
  CONSTRAINT assignments_teacher_fk FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE RESTRICT,
  CONSTRAINT assignments_total_marks_check CHECK (total_marks >= 0)
) ENGINE=InnoDB;

CREATE TABLE assignment_submissions (
  assignment_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  file_url TEXT,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  marks_obtained DECIMAL(8,2),
  feedback TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'submitted',
  PRIMARY KEY (assignment_id, student_id),
  CONSTRAINT assignment_submissions_assignment_fk FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  CONSTRAINT assignment_submissions_student_fk FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  CONSTRAINT assignment_submissions_status_check CHECK (status IN ('draft', 'submitted', 'late', 'graded', 'returned')),
  CONSTRAINT assignment_submissions_marks_check CHECK (marks_obtained IS NULL OR marks_obtained >= 0)
) ENGINE=InnoDB;

CREATE TABLE quizzes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  subject_id BIGINT NOT NULL,
  teacher_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  instructions TEXT,
  total_marks DECIMAL(8,2) NOT NULL DEFAULT 0,
  start_time DATETIME,
  end_time DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT quizzes_subject_fk FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
  CONSTRAINT quizzes_teacher_fk FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE RESTRICT,
  CONSTRAINT quizzes_marks_check CHECK (total_marks >= 0),
  CONSTRAINT quizzes_time_check CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time)
) ENGINE=InnoDB;

CREATE TABLE quiz_questions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  quiz_id BIGINT NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(40) NOT NULL,
  marks DECIMAL(8,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT quiz_questions_quiz_fk FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  CONSTRAINT quiz_questions_type_check CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false', 'short_answer', 'essay')),
  CONSTRAINT quiz_questions_marks_check CHECK (marks >= 0)
) ENGINE=InnoDB;

CREATE TABLE quiz_options (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  question_id BIGINT NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT quiz_options_question_fk FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE quiz_results (
  quiz_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  score DECIMAL(8,2) NOT NULL DEFAULT 0,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  time_taken INT,
  PRIMARY KEY (quiz_id, student_id),
  CONSTRAINT quiz_results_quiz_fk FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  CONSTRAINT quiz_results_student_fk FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  CONSTRAINT quiz_results_score_check CHECK (score >= 0),
  CONSTRAINT quiz_results_time_taken_check CHECK (time_taken IS NULL OR time_taken >= 0)
) ENGINE=InnoDB;

CREATE TABLE exams (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  subject_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  exam_date DATE NOT NULL,
  total_marks DECIMAL(8,2) NOT NULL,
  passing_marks DECIMAL(8,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT exams_subject_fk FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
  CONSTRAINT exams_marks_check CHECK (total_marks > 0 AND passing_marks >= 0 AND passing_marks <= total_marks)
) ENGINE=InnoDB;

CREATE TABLE exam_results (
  exam_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  marks_obtained DECIMAL(8,2) NOT NULL,
  percentage DECIMAL(5,2),
  grade VARCHAR(20),
  remarks TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (exam_id, student_id),
  CONSTRAINT exam_results_exam_fk FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  CONSTRAINT exam_results_student_fk FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  CONSTRAINT exam_results_marks_check CHECK (marks_obtained >= 0),
  CONSTRAINT exam_results_percentage_check CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100))
) ENGINE=InnoDB;

CREATE TABLE documents (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  subject_id BIGINT NOT NULL,
  teacher_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type VARCHAR(80),
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT documents_subject_fk FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT documents_teacher_fk FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE live_classes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  section_id BIGINT NOT NULL,
  subject_id BIGINT NOT NULL,
  teacher_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  zoom_meeting_id VARCHAR(100),
  zoom_join_url TEXT,
  zoom_start_url TEXT,
  start_time DATETIME NOT NULL,
  duration_minutes INT NOT NULL,
  recording_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT live_classes_section_fk FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  CONSTRAINT live_classes_subject_fk FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
  CONSTRAINT live_classes_teacher_fk FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE RESTRICT,
  CONSTRAINT live_classes_duration_check CHECK (duration_minutes > 0),
  CONSTRAINT live_classes_status_check CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled'))
) ENGINE=InnoDB;

CREATE TABLE live_class_attendance (
  live_class_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  joined_at DATETIME,
  left_at DATETIME,
  attendance_status VARCHAR(30) NOT NULL DEFAULT 'present',
  duration_minutes INT,
  PRIMARY KEY (live_class_id, student_id),
  CONSTRAINT live_class_attendance_live_class_fk FOREIGN KEY (live_class_id) REFERENCES live_classes(id) ON DELETE CASCADE,
  CONSTRAINT live_class_attendance_student_fk FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  CONSTRAINT live_class_attendance_status_check CHECK (attendance_status IN ('present', 'absent', 'late', 'left_early')),
  CONSTRAINT live_class_attendance_duration_check CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
  CONSTRAINT live_class_attendance_time_check CHECK (left_at IS NULL OR joined_at IS NULL OR left_at >= joined_at)
) ENGINE=InnoDB;

CREATE TABLE fee_structures (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  class_id BIGINT NOT NULL,
  title VARCHAR(150) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  frequency VARCHAR(40) NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fee_structures_class_title_unique UNIQUE (class_id, title),
  CONSTRAINT fee_structures_class_fk FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fee_structures_amount_check CHECK (amount >= 0),
  CONSTRAINT fee_structures_frequency_check CHECK (frequency IN ('one_time', 'monthly', 'quarterly', 'biannual', 'annual'))
) ENGINE=InnoDB;

CREATE TABLE fee_vouchers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  student_id BIGINT NOT NULL,
  fee_structure_id BIGINT NOT NULL,
  voucher_no VARCHAR(100) NOT NULL UNIQUE,
  issue_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  due_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  fine DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fee_vouchers_student_fk FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fee_vouchers_fee_structure_fk FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id) ON DELETE RESTRICT,
  CONSTRAINT fee_vouchers_amount_check CHECK (amount >= 0 AND discount >= 0 AND fine >= 0),
  CONSTRAINT fee_vouchers_date_check CHECK (due_date >= issue_date),
  CONSTRAINT fee_vouchers_status_check CHECK (status IN ('unpaid', 'partial', 'paid', 'overdue', 'cancelled'))
) ENGINE=InnoDB;

CREATE TABLE payments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  voucher_id BIGINT NOT NULL,
  amount_paid DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  transaction_reference VARCHAR(150) UNIQUE,
  payment_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  remarks TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT payments_voucher_fk FOREIGN KEY (voucher_id) REFERENCES fee_vouchers(id) ON DELETE CASCADE,
  CONSTRAINT payments_amount_paid_check CHECK (amount_paid > 0)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50),
  is_read BOOLEAN NOT NULL DEFAULT false,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE announcements (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  created_by BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  audience_type VARCHAR(50) NOT NULL,
  publish_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiry_date DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT announcements_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT announcements_audience_type_check CHECK (audience_type IN ('all', 'admins', 'teachers', 'students', 'parents', 'class', 'section')),
  CONSTRAINT announcements_expiry_check CHECK (expiry_date IS NULL OR expiry_date > publish_date)
) ENGINE=InnoDB;

CREATE TABLE zoom_settings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_email VARCHAR(255) NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  webhook_secret TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  module VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  record_id VARCHAR(100),
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT audit_logs_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX user_roles_role_id_idx ON user_roles (role_id);
CREATE INDEX role_permissions_permission_id_idx ON role_permissions (permission_id);
CREATE INDEX teacher_subjects_subject_section_idx ON teacher_subjects (subject_id, section_id);
CREATE INDEX student_subjects_subject_section_idx ON student_subjects (subject_id, section_id);
CREATE INDEX student_enrollments_section_id_idx ON student_enrollments (section_id);
CREATE INDEX timetable_section_day_idx ON timetable (section_id, day_of_week);
CREATE INDEX attendance_student_date_idx ON attendance (student_id, attendance_date);
CREATE INDEX assignments_subject_teacher_idx ON assignments (subject_id, teacher_id);
CREATE INDEX assignment_submissions_student_idx ON assignment_submissions (student_id);
CREATE INDEX quiz_results_student_idx ON quiz_results (student_id);
CREATE INDEX exam_results_student_idx ON exam_results (student_id);
CREATE INDEX live_classes_section_start_idx ON live_classes (section_id, start_time);
CREATE INDEX live_class_attendance_student_idx ON live_class_attendance (student_id);
CREATE INDEX fee_vouchers_student_status_idx ON fee_vouchers (student_id, status);
CREATE INDEX payments_voucher_id_idx ON payments (voucher_id);
CREATE INDEX notifications_user_read_idx ON notifications (user_id, is_read);
CREATE INDEX announcements_audience_publish_idx ON announcements (audience_type, publish_date);
CREATE INDEX audit_logs_user_created_idx ON audit_logs (user_id, created_at);
CREATE INDEX audit_logs_module_record_idx ON audit_logs (module, record_id);
