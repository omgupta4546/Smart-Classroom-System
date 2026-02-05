<?php
session_start();
if ($_SESSION['role'] !== 'professor') {
    header("Location: dashboard.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Create Class | Antigravity</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <?php include 'includes/navbar.php'; ?>

    <div class="flex-center" style="min-height: 80vh;">
        <div class="glass-panel fade-in" style="padding: 40px; width: 100%; max-width: 500px;">
            <h2 style="margin-bottom: 20px;">Create New Class</h2>
            
            <form action="api/class_api.php" method="POST">
                <input type="hidden" name="action" value="create_class">
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px;">Subject Name</label>
                    <input type="text" name="subject_name" class="input-glass" placeholder="e.g. Advanced AI Integration" required>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px;">Class Code (Auto-generated if empty)</label>
                    <input type="text" name="class_code" class="input-glass" placeholder="e.g. AI-101" disabled style="opacity: 0.5; cursor: not-allowed;">
                    <small class="text-muted">Code will be generated automatically.</small>
                </div>

                <button type="submit" class="btn-glow" style="width: 100%;">Generate Class</button>
            </form>
        </div>
    </div>
</body>
</html>
