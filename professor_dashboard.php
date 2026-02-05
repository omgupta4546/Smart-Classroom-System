<?php
// professor_dashboard.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Professor Dashboard | Antigravity</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <?php include 'includes/navbar.php'; ?>

    <div class="content-wrapper" style="padding: 100px 30px 30px;">
        <h1 class="fade-in">Professor Dashboard</h1>
        <p class="text-muted fade-in">Manage classes, attendance, and assignments.</p>
        
<?php
            require_once 'includes/db.php';
            $prof_id = $_SESSION['user_id'];
            
            // Get Stats
            $class_stmt = $pdo->prepare("SELECT COUNT(*) FROM classes WHERE professor_id = ?");
            $class_stmt->execute([$prof_id]);
            $total_classes = $class_stmt->fetchColumn();

            // Get Recent Classes
            $classes_stmt = $pdo->prepare("SELECT * FROM classes WHERE professor_id = ? ORDER BY created_at DESC");
            $classes_stmt->execute([$prof_id]);
            $classes = $classes_stmt->fetchAll();
            ?>

            <!-- Analytics Cards -->
            <div class="glass-panel card" style="flex: 1; min-width: 250px;">
                <h3><i class="fas fa-chalkboard text-gradient"></i> Total Classes</h3>
                <div style="font-size: 2.5rem; font-weight: 800; margin-top: 10px;"><?php echo $total_classes; ?></div>
            </div>

            <div class="glass-panel card" style="flex: 1; min-width: 250px;">
                <h3><i class="fas fa-user-graduate text-gradient"></i> Total Students</h3>
                <div style="font-size: 2.5rem; font-weight: 800; margin-top: 10px;">--</div> 
                <small class="text-muted">Active enrollments</small>
            </div>
        </div>

        <h3 style="margin-top: 40px; margin-bottom: 20px;">Your Classes</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
            <?php foreach($classes as $c): ?>
            <div class="glass-panel card">
                <h4><?php echo htmlspecialchars($c['subject_name']); ?></h4>
                <div class="chip warning" style="margin-top: 10px;"><?php echo htmlspecialchars($c['class_code']); ?></div>
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <a href="classroom.php?code=<?php echo $c['class_code']; ?>" class="btn-glow" style="padding: 8px 16px; font-size: 0.8rem;">View Class</a>
                    <a href="attendance.php?class_code=<?php echo $c['class_code']; ?>" class="btn-outline" style="padding: 8px 16px; font-size: 0.8rem;">Attendance</a>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
</body>
</html>
