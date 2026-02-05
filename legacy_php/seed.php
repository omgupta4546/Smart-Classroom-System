<?php
require_once 'includes/db.php';

$password = password_hash('123456', PASSWORD_DEFAULT);

$users = [
    ['Student User', 'student@test.com', $password, 'student', 'STD-001'],
    ['Professor Smith', 'prof@test.com', $password, 'professor', NULL],
    ['Admin User', 'admin@test.com', $password, 'admin', NULL]
];

foreach ($users as $u) {
    try {
        $stmt = $pdo->prepare("INSERT IGNORE INTO users (name, email, password, role, roll_no) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute($u);
        echo "Created: {$u[1]}\n";
    } catch (PDOException $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>
