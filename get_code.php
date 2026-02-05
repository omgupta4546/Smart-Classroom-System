<?php
require_once 'includes/db.php';
$stmt = $pdo->query("SELECT class_code FROM classes LIMIT 1");
$code = $stmt->fetchColumn();
echo $code ? "Class Code: " . $code : "No classes found.";
?>
