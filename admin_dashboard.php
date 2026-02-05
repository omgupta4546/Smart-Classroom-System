<?php
// admin_dashboard.php
require_once 'includes/db.php';

// Fetch key stats
$user_count = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
$class_count = $pdo->query("SELECT COUNT(*) FROM classes")->fetchColumn();

// Fetch users
$users = $pdo->query("SELECT * FROM users ORDER BY created_at DESC LIMIT 50")->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Dashboard | Antigravity</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid var(--glass-border); }
        th { color: var(--text-muted); font-size: 0.9rem; }
    </style>
</head>
<body>
    <?php include 'includes/navbar.php'; ?>

    <div class="content-wrapper" style="padding: 100px 30px 30px;">
        <h1 class="fade-in"><span class="text-gradient">Admin</span> Panel</h1>
        
        <div style="display: flex; gap: 20px; margin-top: 30px; margin-bottom: 40px; flex-wrap: wrap;">
            <div class="glass-panel card" style="flex: 1;">
                <h3>Total Users</h3>
                <div style="font-size: 2.5rem; font-weight: 800; color: var(--accent-primary);"><?php echo $user_count; ?></div>
            </div>
            <div class="glass-panel card" style="flex: 1;">
                <h3>Total Classes</h3>
                 <div style="font-size: 2.5rem; font-weight: 800; color: var(--accent-secondary);"><?php echo $class_count; ?></div>
            </div>
            <div class="glass-panel card" style="flex: 1;">
                <h3>System Health</h3>
                <div class="chip success" style="margin-top: 10px;">Operational</div>
            </div>
        </div>

        <div class="glass-panel" style="padding: 30px; overflow-x: auto;">
            <h3>User Management</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Roll No</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($users as $u): ?>
                    <tr>
                        <td>#<?php echo $u['id']; ?></td>
                        <td><?php echo htmlspecialchars($u['name']); ?></td>
                        <td><?php echo htmlspecialchars($u['email']); ?></td>
                        <td>
                            <?php if($u['role']=='admin') echo '<span class="chip critical">Admin</span>'; ?>
                            <?php if($u['role']=='professor') echo '<span class="chip warning">Professor</span>'; ?>
                            <?php if($u['role']=='student') echo '<span class="chip success">Student</span>'; ?>
                        </td>
                        <td><?php echo htmlspecialchars($u['roll_no'] ?: '-'); ?></td>
                        <td>
                            <button class="btn-outline" style="padding: 5px 10px; font-size: 0.8rem;">Edit</button>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            </table>
        </div>

        <div class="glass-panel" style="padding: 30px; overflow-x: auto; margin-top: 30px;">
            <h3>Class Management</h3>
            <?php 
            $classes = $pdo->query("SELECT c.*, u.name as prof_name FROM classes c JOIN users u ON c.professor_id = u.id ORDER BY c.created_at DESC")->fetchAll();
            ?>
            <table>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Subject</th>
                        <th>Professor</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($classes as $c): ?>
                    <tr>
                        <td><span class="chip warning"><?php echo htmlspecialchars($c['class_code']); ?></span></td>
                        <td><?php echo htmlspecialchars($c['subject_name']); ?></td>
                        <td><?php echo htmlspecialchars($c['prof_name']); ?></td>
                        <td>
                            <form action="api/admin_action.php" method="POST" onsubmit="return confirm('Delete this class?');">
                                <input type="hidden" name="action" value="delete_class">
                                <input type="hidden" name="class_id" value="<?php echo $c['id']; ?>">
                                <button type="submit" class="btn-outline" style="color: var(--status-critical); border-color: var(--status-critical);">Delete</button>
                            </form>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
