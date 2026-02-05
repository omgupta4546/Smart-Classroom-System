<?php
session_start();
require_once 'includes/db.php';

if ($_SESSION['role'] !== 'professor') die("Access Denied");

$class_id = $_GET['class_id'];

// Get Class Info
$stmt = $pdo->prepare("SELECT * FROM classes WHERE id = ?");
$stmt->execute([$class_id]);
$class = $stmt->fetch();

// Get Attendance Data: Date | Student | Status
$query = "SELECT a.date, u.name, u.roll_no, a.status 
          FROM attendance a 
          JOIN users u ON a.student_id = u.id 
          WHERE a.class_id = ? 
          ORDER BY a.date DESC, u.name ASC";
$stmt = $pdo->prepare($query);
$stmt->execute([$class_id]);
$records = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Attendance Report | <?php echo $class['subject_name']; ?></title>
    <style>
        body { font-family: sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f4f4f4; }
        .btn { padding: 10px 20px; background: #2ecc71; color: white; border: none; cursor: pointer; text-decoration: none; display: inline-block; }
    </style>
</head>
<body>
    <h1>Attendance Report: <?php echo htmlspecialchars($class['subject_name']); ?> (<?php echo $class['class_code']; ?>)</h1>
    
    <a href="#" onclick="window.print()" class="btn">Print / Save as PDF</a>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Student Name</th>
                <th>Roll No</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach($records as $r): ?>
            <tr>
                <td><?php echo $r['date']; ?></td>
                <td><?php echo htmlspecialchars($r['name']); ?></td>
                <td><?php echo htmlspecialchars($r['roll_no']); ?></td>
                <td style="color: <?php echo $r['status']=='present' ? 'green':'red'; ?>; font-weight: bold;">
                    <?php echo ucfirst($r['status']); ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</body>
</html>
