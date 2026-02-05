<?php session_start(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Contact Us | Antigravity</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <?php include 'includes/navbar.php'; ?>

    <div class="content-wrapper" style="padding: 100px 20px;">
        <div class="glass-panel fade-in" style="max-width: 600px; margin: 0 auto; padding: 40px;">
            <h2 style="text-align: center; margin-bottom: 30px;">Get in Touch</h2>
            
            <form action="index.php" method="GET" onsubmit="alert('Message Sent! We will contact you shortly.');">
                <div style="margin-bottom: 20px;">
                    <label>Name</label>
                    <input type="text" class="input-glass" required>
                </div>
                <div style="margin-bottom: 20px;">
                    <label>Email</label>
                    <input type="email" class="input-glass" required>
                </div>
                <div style="margin-bottom: 20px;">
                    <label>Message</label>
                    <textarea class="input-glass" rows="5" required></textarea>
                </div>
                <button type="submit" class="btn-glow" style="width: 100%;">Send Message</button>
            </form>
        </div>
    </div>

    <!-- Map Placeholder (Optional) -->
    <div style="text-align: center; margin-top: 50px;" class="fade-in">
        <p class="text-muted"><i class="fas fa-map-marker-alt"></i> 123 AI Boulevard, Tech City, 90210</p>
        <p class="text-muted"><i class="fas fa-envelope"></i> support@aiclass.com</p>
    </div>

</body>
</html>
