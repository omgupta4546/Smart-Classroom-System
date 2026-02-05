<?php session_start(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Smart Classroom | Antigravity</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script> 
    <!-- Note: FontAwesome kit might need replacement or local assets if not working, assuming FA CDN for prototype -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>

    <!-- Navbar -->
    <nav class="glass-panel" style="position: fixed; top: 20px; left: 5%; width: 90%; z-index: 1000; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center;">
        <div class="logo" style="font-weight: 800; font-size: 1.5rem; letter-spacing: -1px;">
            <i class="fas fa-brain text-gradient"></i> AI<span class="text-gradient">CLASS</span>
        </div>
        <div class="menu">
            <?php if(isset($_SESSION['user_id'])): ?>
                <a href="dashboard.php" class="btn-glow">Dashboard</a>
                <a href="logout.php" class="btn-outline" style="padding: 10px 20px; border-radius: 50px; text-decoration: none; font-weight: 600; margin-left: 10px;">Logout</a>
            <?php else: ?>
                <a href="login.php" class="btn-glow">Login</a>
            <?php endif; ?>
        </div>
    </nav>

    <!-- Hero Section -->
    <header style="min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; padding: 120px 20px 0;">
        <div class="hero-content fade-in" style="max-width: 800px;">
            <div class="chip success" style="margin-bottom: 20px; box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);">
                <i class="fas fa-check-circle" style="margin-right: 8px;"></i> AI Powered Attendance
            </div>
            <h1 style="font-size: 3.5rem; line-height: 1.1; margin-bottom: 20px; font-weight: 800;">
                The Future of <br> <span class="text-gradient" style="font-size: 4rem;">Smart Classrooms</span>
            </h1>
            <p class="text-muted" style="font-size: 1.2rem; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto;">
                Automate attendance with facial recognition, detect plagiarism instantly, and manage assignments with a premium, futuristic dashboard.
            </p>
            
            <div class="cta-buttons" style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
                <a href="signup.php?role=student" class="glass-panel card" style="text-decoration: none; color: white; padding: 30px; min-width: 200px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1);">
                    <i class="fas fa-user-graduate" style="font-size: 2rem; margin-bottom: 15px; color: var(--accent-secondary);"></i>
                    <h3>Student</h3>
                    <p class="text-muted" style="font-size: 0.9rem; margin-top: 5px;">Join Class & Track Attendance</p>
                </a>
                
                <a href="signup.php?role=professor" class="glass-panel card" style="text-decoration: none; color: white; padding: 30px; min-width: 200px; cursor: pointer; border: 1px solid rgba(99, 102, 241, 0.3);">
                    <i class="fas fa-chalkboard-teacher" style="font-size: 2rem; margin-bottom: 15px; color: var(--accent-primary);"></i>
                    <h3>Professor</h3>
                    <p class="text-muted" style="font-size: 0.9rem; margin-top: 5px;">Smart Analytics & Plagiarism AI</p>
                </a>
            </div>
        </div>
    </header>

    <!-- Features Section -->
    <section style="padding: 100px 20px;">
        <div class="hero-content fade-in" style="max-width: 1200px; margin: 0 auto;">
            <h2 style="text-align: center; font-size: 2.5rem; margin-bottom: 60px;">Why Choose <span class="text-gradient">AI Class</span>?</h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
                <!-- Feature 1 -->
                <div class="glass-panel card">
                    <div style="width: 60px; height: 60px; background: rgba(99, 102, 241, 0.2); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <i class="fas fa-camera" style="font-size: 1.5rem; color: var(--accent-primary);"></i>
                    </div>
                    <h3>Smart Attendance</h3>
                    <p class="text-muted" style="margin-top: 10px;">Face recognition technology that marks attendance in seconds with 99.9% accuracy.</p>
                </div>

                <!-- Feature 2 -->
                <div class="glass-panel card">
                    <div style="width: 60px; height: 60px; background: rgba(236, 72, 153, 0.2); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <i class="fas fa-shield-alt" style="font-size: 1.5rem; color: var(--accent-secondary);"></i>
                    </div>
                    <h3>Anti-Plagiarism</h3>
                    <p class="text-muted" style="margin-top: 10px;">Automated similarity detection for assignments to ensure academic integrity.</p>
                </div>

                <!-- Feature 3 -->
                <div class="glass-panel card">
                    <div style="width: 60px; height: 60px; background: rgba(16, 185, 129, 0.2); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <i class="fas fa-chart-pie" style="font-size: 1.5rem; color: var(--status-success);"></i>
                    </div>
                    <h3>Analytics</h3>
                    <p class="text-muted" style="margin-top: 10px;">Detailed reports for professors to track student performance and engagement.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer style="border-top: 1px solid var(--glass-border); padding: 60px 20px; text-align: center; background: rgba(0,0,0,0.2);">
        <div class="logo" style="font-weight: 800; font-size: 1.5rem; letter-spacing: -1px; margin-bottom: 20px;">
            <i class="fas fa-brain text-gradient"></i> AI<span class="text-gradient">CLASS</span>
        </div>
        <div style="margin-bottom: 20px; display: flex; justify-content: center; gap: 20px; font-size: 0.9rem;">
            <a href="terms.php" class="text-muted" style="text-decoration: none;">Terms & Privacy</a>
            <a href="contact.php" class="text-muted" style="text-decoration: none;">Contact Support</a>
        </div>
        <p class="text-muted" style="margin-bottom: 20px;">&copy; 2026 Smart Classroom Platform. All rights reserved.</p>
        <div style="display: flex; justify-content: center; gap: 20px;">
            <a href="#" class="text-muted"><i class="fab fa-github"></i></a>
            <a href="#" class="text-muted"><i class="fab fa-twitter"></i></a>
            <a href="#" class="text-muted"><i class="fab fa-linkedin"></i></a>
        </div>
    </footer>

    <script src="assets/js/app.js"></script>
</body>
</html>
