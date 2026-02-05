<?php
session_start();
require_once '../includes/db.php';

if ($_SESSION['role'] !== 'admin') {
    die("Access Denied");
}

$action = $_POST['action'] ?? '';

if ($action === 'delete_class') {
    $class_id = $_POST['class_id'];
    $stmt = $pdo->prepare("DELETE FROM classes WHERE id = ?");
    $stmt->execute([$class_id]);
    header("Location: ../admin_dashboard.php?msg=Class Deleted");
}

if ($action === 'delete_user') {
    $user_id = $_POST['user_id'];
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    header("Location: ../admin_dashboard.php?msg=User Deleted");
}
?>
