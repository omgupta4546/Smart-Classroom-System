<?php
session_start();
require_once 'includes/db.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

$user_id = $_SESSION['user_id'];
$msg = $_GET['msg'] ?? '';

// Handle Update
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $phone = $_POST['phone'];
    $batch_no = $_POST['batch_no'] ?? null;
    $roll_no = $_POST['roll_no'] ?? null;
    $name = $_POST['name'];

    // Handle Avatar Upload
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === 0) {
        $allowed = ['jpg', 'jpeg', 'png'];
        $ext = strtolower(pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION));
        
        if (in_array($ext, $allowed)) {
            $new_name = "avatar_" . $user_id . "_" . time() . "." . $ext;
            if (!is_dir('uploads/avatars')) mkdir('uploads/avatars', 0777, true);
            move_uploaded_file($_FILES['avatar']['tmp_name'], "uploads/avatars/" . $new_name);
            
            // Update DB
            $upd = $pdo->prepare("UPDATE users SET profile_pic = ? WHERE id = ?");
            $upd->execute([$new_name, $user_id]);
            header("Location: profile.php?msg=Photo Updated");
            exit();
        }
    }

    $sql = "UPDATE users SET name = ?, phone = ?";
    $params = [$name, $phone];

    if ($_SESSION['role'] === 'student') {
        $sql .= ", roll_no = ?, batch_no = ?";
        $params[] = $roll_no;
        $params[] = $batch_no;
    }
    
    $sql .= " WHERE id = ?";
    $params[] = $user_id;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    $_SESSION['name'] = $name; // Update session name
    header("Location: profile.php?msg=Profile Updated");
    exit();
}

// Fetch User
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Profile | Antigravity</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <?php include 'includes/navbar.php'; ?>

    <div class="content-wrapper" style="padding: 100px 20px;">
        <div class="glass-panel fade-in" style="max-width: 600px; margin: 0 auto; padding: 40px;">
            <form method="POST" enctype="multipart/form-data">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 100px; height: 100px; background: var(--accent-primary); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: bold; overflow: hidden; position: relative;">
                        <?php if(!empty($user['profile_pic'])): ?>
                            <img src="uploads/avatars/<?php echo htmlspecialchars($user['profile_pic']); ?>" style="width: 100%; height: 100%; object-fit: cover;">
                        <?php else: ?>
                            <?php echo substr($user['name'], 0, 1); ?>
                        <?php endif; ?>
                    </div>
                    <label class="btn-outline" style="margin-top: 15px; display: inline-block; cursor: pointer; padding: 5px 15px; font-size: 0.8rem;">
                        <i class="fas fa-camera"></i> Change Photo
                        <input type="file" name="avatar" style="display: none;" onchange="this.form.submit()">
                    </label>
                    <h2 style="margin-top: 10px;"><?php echo htmlspecialchars($user['name']); ?></h2>
                    <div class="chip success"><?php echo ucfirst($user['role']); ?></div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div style="margin-bottom: 20px;">
                        <label>Full Name</label>
                        <input type="text" name="name" class="input-glass" value="<?php echo htmlspecialchars($user['name']); ?>" required>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label>Email (Read Only)</label>
                        <input type="email" class="input-glass" value="<?php echo htmlspecialchars($user['email']); ?>" readonly style="opacity: 0.7;">
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <label>Phone Number</label>
                    <input type="text" name="phone" class="input-glass" value="<?php echo htmlspecialchars($user['phone'] ?? ''); ?>" placeholder="+1 234 567 890">
                </div>

                <?php if($user['role'] === 'student'): ?>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div style="margin-bottom: 20px;">
                        <label>Roll Number</label>
                        <input type="text" name="roll_no" class="input-glass" value="<?php echo htmlspecialchars($user['roll_no'] ?? ''); ?>">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label>Batch Number</label>
                        <input type="text" name="batch_no" class="input-glass" value="<?php echo htmlspecialchars($user['batch_no'] ?? ''); ?>" placeholder="Batch-A">
                    </div>
                </div>
                <?php endif; ?>

                <div style="border-top: 1px solid var(--glass-border); margin: 20px 0;"></div>

                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <a href="dashboard.php" class="btn-outline">Cancel</a>
                    <button type="submit" class="btn-glow">Save Changes</button>
                </div>
            </form>
        </div>
    </div>
    <script src="assets/js/app.js"></script>
</body>
</html>
