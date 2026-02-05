<?php
// Retrieve updated profile pic if not in session (optional but cleaner to just query simply or trust session)
// Since navbar is included everywhere, let's just use session or a quick lookup if needed. For speed, we'll keep session or just check file.
// Ideally, login should store profile_pic_url in session.
$nav_profile_pic = null;
if (isset($_SESSION['user_id'])) {
    // Quick cache check (optimized)
    global $pdo; // Ensure $pdo is available
    if (!$pdo) require_once 'db.php';
    $stmt = $pdo->prepare("SELECT profile_pic FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $nav_profile_pic = $stmt->fetchColumn();
}
?>
<nav class="glass-panel" style="position: fixed; top: 20px; left: 5%; width: 90%; z-index: 1000; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center;">
    <div class="logo" style="font-weight: 800; font-size: 1.5rem;">
        <a href="dashboard.php" style="text-decoration: none;">
            <i class="fas fa-brain text-gradient"></i> AI<span class="text-gradient">CLASS</span>
        </a>
    </div>

    <!-- Mobile Toggle -->
    <button class="menu-toggle" onclick="document.querySelector('.menu').classList.toggle('active')" style="display: none; background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">
        <i class="fas fa-bars"></i>
    </button>

    <div class="menu">
        <div style="display: flex; align-items: center; gap: 10px; margin-right: 15px;">
            <?php if($nav_profile_pic): ?>
                <img src="uploads/avatars/<?php echo htmlspecialchars($nav_profile_pic); ?>" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-primary);">
            <?php else: ?>
                <div style="width: 35px; height: 35px; background: var(--glass-bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 1px solid var(--glass-border);">
                    <i class="fas fa-user"></i>
                </div>
            <?php endif; ?>
            <span class="text-muted user-info">
                <?php echo isset($_SESSION['name']) ? $_SESSION['name'] : ''; ?> 
                (<?php echo isset($_SESSION['role']) ? ucfirst($_SESSION['role']) : ''; ?>)
            </span>
        </div>
        <a href="profile.php" class="btn-glow mobile-link" style="padding: 8px 16px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 0.8rem; margin-right: 10px;">Profile</a>
        <a href="api/auth.php?action=logout" class="btn-outline mobile-link" style="padding: 8px 16px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 0.8rem;">Logout</a>
    </div>
</nav>

<style>
/* Responsive Nav Styles loaded here for component portability */
@media (max-width: 768px) {
    .menu-toggle { display: block !important; }
    
    .menu {
        display: none;
        position: absolute;
        top: 70px;
        right: 0;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(20px);
        width: 200px;
        border-radius: 15px;
        border: 1px solid var(--glass-border);
        flex-direction: column;
        padding: 20px;
        gap: 15px;
        text-align: center;
    }

    .menu.active { display: flex; }
    
    .user-info { display: block; margin-bottom: 10px; font-size: 0.8rem; }
    .mobile-link { width: 100%; display: block; margin: 0 !important; }
}
</style>
