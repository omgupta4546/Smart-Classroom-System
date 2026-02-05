<?php
session_start();
require_once '../includes/db.php';

$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($action === 'create_class') {
    if ($_SESSION['role'] !== 'professor') die("Unauthorized");

    $subject_name = $_POST['subject_name'];
    $professor_id = $_SESSION['user_id'];
    
    // Generate simple random 6-char code
    $class_code = strtoupper(substr(md5(uniqid()), 0, 6));

    try {
        $stmt = $pdo->prepare("INSERT INTO classes (class_code, subject_name, professor_id) VALUES (?, ?, ?)");
        $stmt->execute([$class_code, $subject_name, $professor_id]);
        
        // Redirect to success/dashboard
        header("Location: ../dashboard.php?msg=Class Created: $class_code");
    } catch (PDOException $e) {
        die("Error: " . $e->getMessage());
    }
}

if ($action === 'join_class') {
    if ($_SESSION['role'] !== 'student') die("Unauthorized");

    $class_code = $_POST['class_code'];
    $student_id = $_SESSION['user_id'];

    // Find class
    $stmt = $pdo->prepare("SELECT id FROM classes WHERE class_code = ?");
    $stmt->execute([$class_code]);
    $class = $stmt->fetch();

    if ($class) {
        try {
            $stmt = $pdo->prepare("INSERT INTO class_members (class_id, student_id) VALUES (?, ?)");
            $stmt->execute([$class['id'], $student_id]);
            header("Location: ../dashboard.php?msg=Joined Successfully");
        } catch (PDOException $e) {
             header("Location: ../dashboard.php?error=Already Joined or Error");
        }
    } else {
        header("Location: ../dashboard.php?error=Invalid Code");
    }
}
?>
