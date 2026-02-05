<?php
require_once 'includes/db.php';

// 1. Get Professor ID
$stmt = $pdo->prepare("SELECT id FROM users WHERE role = 'professor' LIMIT 1");
$stmt->execute();
$prof_id = $stmt->fetchColumn();

if (!$prof_id) {
    die("Error: No Professor found. Please run seed.php first.");
}

// 2. Insert Class
$class_code = "AI-101";
$subject = "Advanced AI";

// Check if exists
$check = $pdo->prepare("SELECT id FROM classes WHERE class_code = ?");
$check->execute([$class_code]);
if (!$check->fetch()) {
    $insert = $pdo->prepare("INSERT INTO classes (class_code, subject_name, professor_id) VALUES (?, ?, ?)");
    $insert->execute([$class_code, $subject, $prof_id]);
    echo "Created Class: " . $class_code;
} else {
    echo "Class Code: " . $class_code;
}
?>
