<?php
header('Content-Type: application/json');
require_once '../includes/db.php'; // Adjust path if needed
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['descriptor']) || empty($input['descriptor'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing descriptor data']);
    exit;
}

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];
// Descriptor comes as an array of floats, we store as JSON string
$descriptorJson = json_encode($input['descriptor']);

try {
    // Check if column exists, if not, migration might have failed, but we assume it ran.
    // Use the shared connection $pdo from db.php
    
    $stmt = $pdo->prepare("UPDATE users SET face_descriptor = ?, is_face_registered = 1 WHERE id = ?");
    $stmt->execute([$descriptorJson, $userId]);

    echo json_encode(['status' => 'success', 'message' => 'Face registered successfully']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
