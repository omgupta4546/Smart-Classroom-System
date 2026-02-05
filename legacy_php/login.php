<?php session_start(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Login | AI Smart Classroom</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
</head>
<body class="flex-center">

    <div class="glass-panel fade-in" style="padding: 40px; width: 100%; max-width: 400px;">
        <h2 style="text-align: center; margin-bottom: 10px;">Welcome Back</h2>
        <p class="text-muted" style="text-align: center; margin-bottom: 30px;">Access your smart dashboard</p>

        <form action="api/auth.php" method="POST">
            <input type="hidden" name="action" value="login">
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Email</label>
                <input type="email" name="email" class="input-glass" placeholder="john@university.edu" required>
            </div>

            <div style="margin-bottom: 30px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Password</label>
                <input type="password" name="password" class="input-glass" placeholder="••••••••" required>
            </div>

            <button type="submit" class="btn-glow" style="width: 100%;">Access Dashboard</button>
        </form>

        <p style="text-align: center; margin-top: 20px; font-size: 0.9rem;">
            New here? <a href="signup.php" class="text-gradient" style="font-weight: 600;">Create an Account</a>
        </p>
    </div>

</body>
</html>
