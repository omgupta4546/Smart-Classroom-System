CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'professor', 'admin') NOT NULL,
    roll_no VARCHAR(50) NULL, -- Only for students
    face_data_path VARCHAR(255) NULL, -- Path to folder containing training images
    is_face_registered BOOLEAN DEFAULT FALSE,
    face_data_path VARCHAR(255) NULL, -- Path to folder containing training images
    is_face_registered BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20) NULL,
    batch_no VARCHAR(20) NULL,
    profile_pic VARCHAR(255) NULL, -- Avatar
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_code VARCHAR(10) NOT NULL UNIQUE,
    subject_name VARCHAR(100) NOT NULL,
    professor_id INT NOT NULL,
    FOREIGN KEY (professor_id) REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class Members (Students joining classes)
CREATE TABLE IF NOT EXISTS class_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(class_id, student_id)
);

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    date DATE NOT NULL,
    student_id INT NOT NULL,
    status ENUM('present', 'absent', 'late') DEFAULT 'absent',
    confidence_score FLOAT NULL, -- Mock score from 'AI'
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    due_date DATE,
    file_path VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Submissions & Plagiarism
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    plagiarism_score INT DEFAULT 0, -- 0 to 100
    plagiarism_status ENUM('safe', 'moderate', 'critical') DEFAULT 'safe',
    grade INT NULL, -- Marks out of 100
    feedback TEXT NULL, -- Professor comments
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notes
CREATE TABLE IF NOT EXISTS class_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);
