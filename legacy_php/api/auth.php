<?php
session_start();
require_once '../includes/db.php';

$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($action === 'register') {
    $name = $_POST['name'];
    $email = $_POST['email'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $role = $_POST['role'];
    $roll_no = $_POST['roll_no'] ?? null;
    $phone = $_POST['phone'] ?? null;
    $batch_no = $_POST['batch_no'] ?? null;

    try {
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, roll_no, phone, batch_no) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $email, $password, $role, $roll_no, $phone, $batch_no]);
        
        // Auto login after reg
        $_SESSION['user_id'] = $pdo->lastInsertId();
        $_SESSION['role'] = $role;
        $_SESSION['name'] = $name;

        header("Location: ../dashboard.php");
    } catch (PDOException $e) {
        // In a real app, handle error gracefully (e.g. duplicate email)
        die("Registration failed: " . $e->getMessage());
    }
}

if ($action === 'login') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['name'] = $user['name'];
        header("Location: ../dashboard.php");
    } else {
        die("Invalid login credentials <a href='../login.php'>Try details</a>");
    }
}

if ($action === 'logout') {
    session_destroy();
    header("Location: ../index.php");
}
?>
