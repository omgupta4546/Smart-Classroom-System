<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

if ($_SESSION['role'] === 'professor') {
    include 'professor_dashboard.php';
} elseif ($_SESSION['role'] === 'student') {
    include 'student_dashboard.php';
} elseif ($_SESSION['role'] === 'admin') {
    include 'admin_dashboard.php';
}
?>
