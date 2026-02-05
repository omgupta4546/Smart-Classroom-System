<?php 
session_start(); 
$role = isset($_GET['role']) ? $_GET['role'] : 'student';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Signup | AI Smart Classroom</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
</head>
<body class="flex-center" style="padding: 20px 0;">

    <div class="glass-panel fade-in" style="padding: 40px; width: 100%; max-width: 450px;">
        <h2 style="text-align: center; margin-bottom: 10px;">
            Join as <span class="text-gradient"><?php echo ucfirst($role); ?></span>
        </h2>
        
        <form action="api/auth.php" method="POST">
            <input type="hidden" name="action" value="register">
            <input type="hidden" name="role" value="<?php echo $role; ?>">
            
            <div style="margin-bottom: 20px;">
                <label>Full Name</label>
                <input type="text" name="name" class="input-glass" required>
            </div>

            <div style="margin-bottom: 20px;">
                <label>Email Address</label>
                <input type="email" name="email" class="input-glass" required>
            </div>

            <?php if ($role == 'student'): ?>
            <div style="margin-bottom: 20px;">
                <label>Roll Number (ID)</label>
                <input type="text" name="roll_no" class="input-glass" required>
            </div>
            <div style="margin-bottom: 20px;">
                <label>Batch Number</label>
                <input type="text" name="batch_no" class="input-glass" placeholder="e.g. Batch 2026-A" required>
            </div>
            <?php endif; ?>
            
            <div style="margin-bottom: 20px;">
                <label>Phone Number</label>
                <input type="text" name="phone" class="input-glass" >
            </div>

            <div style="margin-bottom: 30px;">
                <label>Password</label>
                <input type="password" name="password" class="input-glass" required>
            </div>

            <button type="submit" class="btn-glow" style="width: 100%;">Create Account</button>
        </form>

        <p style="text-align: center; margin-top: 20px;">
            Already have an account? <a href="login.php" class="text-gradient">Login</a>
        </p>
    </div>

</body>
</html>
