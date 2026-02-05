<?php
session_start();
require_once 'includes/db.php';

if ($_SESSION['role'] !== 'professor') {
    die("Unauthorized");
}

$submission_id = $_POST['submission_id'];
$grade = $_POST['grade'];
$feedback = $_POST['feedback'];
$class_code = $_POST['class_code'];

$stmt = $pdo->prepare("UPDATE submissions SET grade = ?, feedback = ? WHERE id = ?");
$stmt->execute([$grade, $feedback, $submission_id]);

header("Location: classroom.php?code=$class_code&msg=Graded Successfully");
?>
