<?php
// student_dashboard.php
require_once 'includes/db.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Student Dashboard | Antigravity</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <?php include 'includes/navbar.php'; ?>

    <div class="content-wrapper" style="padding: 100px 30px 30px;">
        
        <div class="fade-in" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <div>
                <h1>Hello, <?php echo htmlspecialchars($_SESSION['name']); ?></h1>
                <p class="text-muted">Track your attendance and assignments.</p>
            </div>
            
            <a href="face_register.php" class="btn-glow" style="text-decoration: none; font-size: 0.8rem;">
                <i class="fas fa-camera"></i> Setup Face ID
            </a>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            <!-- Join Class Card -->
            <div class="glass-panel card">
                <h3>Join a Class</h3>
                <form action="api/class_api.php" method="POST" style="margin-top: 15px; display: flex; gap: 10px;">
                    <input type="hidden" name="action" value="join_class">
                    <input type="text" name="class_code" class="input-glass" placeholder="Enter Class Code" required>
                    <button type="submit" class="btn-glow" style="padding: 12px;"><i class="fas fa-arrow-right"></i></button>
                </form>
            </div>

<?php
            $student_id = $_SESSION['user_id'];
            
            // Calculate Overall Attendance
            $total_records = $pdo->prepare("SELECT COUNT(*) FROM attendance WHERE student_id = ?");
            $total_records->execute([$student_id]);
            $total = $total_records->fetchColumn();

            $present_records = $pdo->prepare("SELECT COUNT(*) FROM attendance WHERE student_id = ? AND status = 'present'");
            $present_records->execute([$student_id]);
            $present = $present_records->fetchColumn();

            $percentage = $total > 0 ? round(($present / $total) * 100) : 100; // Default 100 if no classes
            $status_color = $percentage >= 75 ? 'success' : ($percentage >= 50 ? 'warning' : 'critical');
            
            // Get Joined Classes
            $my_classes = $pdo->prepare("SELECT c.* FROM classes c JOIN class_members cm ON c.id = cm.class_id WHERE cm.student_id = ?");
            $my_classes->execute([$student_id]);
            $classes = $my_classes->fetchAll();
            ?>

            <!-- Attendance Stats (Real) -->
            <div class="glass-panel card">
                <h3>Overall Attendance</h3>
                <div style="margin-top: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Average</span>
                        <span class="text-gradient" style="font-weight: 800;"><?php echo $percentage; ?>%</span>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="width: <?php echo $percentage; ?>%; height: 100%; background: var(--status-<?php echo $status_color; ?>);"></div>
                    </div>
                    <div style="margin-top: 10px;">
                         <span class="chip <?php echo $status_color; ?>"><?php echo $percentage >= 75 ? 'Safe' : 'Low Attendance'; ?></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- My Classes List -->
        <h3 style="margin-top: 40px; margin-bottom: 20px;">My Classes</h3>
         <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
            <?php foreach($classes as $c): ?>
            <div class="glass-panel card">
                <h4><?php echo htmlspecialchars($c['subject_name']); ?></h4>
                <p class="text-muted" style="margin-top: 5px;">Code: <?php echo htmlspecialchars($c['class_code']); ?></p>
                <div style="margin-top: 20px;">
                    <a href="classroom.php?code=<?php echo $c['class_code']; ?>" class="btn-glow" style="padding: 8px 16px; font-size: 0.8rem; width: 100%; text-align: center; display: block;">Enter Class</a>
                </div>
            </div>
            <?php endforeach; ?>
            
            <?php if(count($classes) === 0): ?>
                <p class="text-muted">You haven't joined any classes yet.</p>
            <?php endif; ?>
        </div>

    </div>
</body>
</html>
