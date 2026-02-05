<?php
header('Content-Type: application/json');
require_once '../includes/db.php';
session_start();

if ($_SESSION['role'] !== 'professor') {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    // In a real app, filter by class_id or similar. For now, fetch all students with faces.
    $stmt = $pdo->prepare("SELECT id, name, face_descriptor FROM users WHERE is_face_registered = 1 AND role = 'student'");
    $stmt->execute();
    $students = $stmt->fetchAll();

    $data = [];
    foreach ($students as $student) {
        if (!empty($student['face_descriptor'])) {
            $data[] = [
                'id' => $student['id'],
                'name' => $student['name'],
                'descriptor' => json_decode($student['face_descriptor']) // descriptors are stored as JSON arrays
            ];
        }
    }

    echo json_encode(['status' => 'success', 'students' => $data]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
