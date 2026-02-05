<?php
session_start();
$role = $_SESSION['role'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Classroom | Antigravity</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .tab-btn {
            background: transparent; border: none; color: var(--text-muted); 
            padding: 15px 30px; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent;
        }
        .tab-btn.active {
            color: white; border-bottom: 2px solid var(--accent-primary);
        }
        .tab-content { display: none; padding: 30px 0; }
        .tab-content.active { display: block; }
    </style>
</head>
<body>
    <?php include 'includes/navbar.php'; ?>

    <!-- Banner -->
    <div class="glass-panel" style="background: linear-gradient(to right, var(--bg-gradient-mid), var(--bg-gradient-start)); padding: 60px 5% 30px; border-bottom: 1px solid var(--glass-border); border-radius: 0 0 24px 24px; margin-top: 60px;">
        <h1 style="font-size: clamp(1.5rem, 5vw, 2.5rem);"><i class="fas fa-book-open"></i> Advanced AI Integration (AI-101)</h1>
        <p class="text-muted">Prof. Dr. Smith</p>
    </div>

    <!-- Tabs -->
    <div style="background: rgba(0,0,0,0.3); padding: 0 5%; display: flex; gap: 10px;">
        <button class="tab-btn active" onclick="switchTab('stream')">Stream</button>
        <button class="tab-btn" onclick="switchTab('classwork')">Classwork</button>
        <button class="tab-btn" onclick="switchTab('people')">Student List</button>
    </div>

    <div class="content-wrapper" style="padding: 20px 5%;">
        
        <!-- Stream Tab -->
        <div id="stream" class="tab-content active fade-in">
            <div class="glass-panel" style="padding: 20px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px;">
                <div style="width: 50px; height: 50px; background: var(--accent-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                    <?php echo substr($_SESSION['name'], 0, 1); ?>
                </div>
                <input type="text" class="input-glass" placeholder="Announce something to your class..." style="border: none; background: transparent;">
            </div>

            <!-- Mock Post -->
            <div class="glass-panel" style="padding: 20px;">
                <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                     <div style="width: 40px; height: 40px; background: var(--accent-secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">P</div>
                     <div>
                         <strong>Prof. Dr. Smith</strong>
                         <div class="text-muted" style="font-size: 0.8rem;">Posted a new assignment: Neural Networks Intro</div>
                     </div>
                </div>
                <p>Please complete the attached assignment by Friday. Note that the plagiarism checker is active.</p>
                <div class="chip warning" style="margin-top: 10px; font-size: 0.7rem;"><i class="fas fa-shield-alt"></i> Anti-Copy Enabled</div>
            </div>
        </div>

<?php
// Top of file fetch logic
require_once 'includes/db.php';
$class_code = $_GET['code'] ?? 'AI-101'; // Default for demo

// Fetch class details
$stmt = $pdo->prepare("SELECT * FROM classes WHERE class_code = ?");
$stmt->execute([$class_code]);
$class_data = $stmt->fetch();

if (!$class_data) die("Class Not Found");
$class_id = $class_data['id'];

// Fetch Notes
$notes = $pdo->prepare("SELECT * FROM class_notes WHERE class_id = ? ORDER BY uploaded_at DESC");
$notes->execute([$class_id]);
$notes_list = $notes->fetchAll();

// Fetch Assignments
$assigns = $pdo->prepare("SELECT * FROM assignments WHERE class_id = ? ORDER BY created_at DESC");
$assigns->execute([$class_id]);
$assignments_list = $assigns->fetchAll();

// Fetch Students
$studs = $pdo->prepare("SELECT u.name, u.email, u.roll_no FROM class_members cm JOIN users u ON cm.student_id = u.id WHERE cm.class_id = ?");
$studs->execute([$class_id]);
$student_list = $studs->fetchAll();
?>

<!-- Updated Classwork Tab -->
<div id="classwork" class="tab-content fade-in">
    <?php if($role === 'professor'): ?>
    <div style="margin-bottom: 30px; display: flex; gap: 10px; flex-wrap: wrap;">
        <button onclick="document.getElementById('note-form').style.display='block'" class="btn-glow"><i class="fas fa-plus"></i> Add Note</button>
        <button onclick="document.getElementById('assign-form').style.display='block'" class="btn-glow" style="background: var(--accent-secondary);"><i class="fas fa-tasks"></i> Create Assignment</button>
    </div>

    <!-- Hidden Forms -->
    <div id="note-form" class="glass-panel" style="display: none; padding: 20px; margin-bottom: 20px;">
        <h4>Upload Note</h4>
        <form action="api/upload.php" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="action" value="upload_note">
            <input type="hidden" name="class_code" value="<?php echo $class_code; ?>">
            <input type="text" name="title" class="input-glass" placeholder="Note Title" required style="margin-bottom: 10px;">
            <input type="file" name="file" class="input-glass" required style="margin-bottom: 10px;">
            <button type="submit" class="btn-glow">Upload</button>
        </form>
    </div>

    <div id="assign-form" class="glass-panel" style="display: none; padding: 20px; margin-bottom: 20px;">
        <h4>Create Assignment</h4>
        <form action="api/upload.php" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="action" value="create_assignment">
            <input type="hidden" name="class_code" value="<?php echo $class_code; ?>">
            <input type="text" name="title" class="input-glass" placeholder="Title" required style="margin-bottom: 10px;">
            <textarea name="description" class="input-glass" placeholder="Instructions..." style="margin-bottom: 10px;"></textarea>
            <input type="date" name="due_date" class="input-glass" required style="margin-bottom: 10px;">
            <input type="file" name="file" class="input-glass" style="margin-bottom: 10px;">
            <button type="submit" class="btn-glow">Create</button>
        </form>
    </div>
    <?php endif; ?>

    <h3>Assignments</h3>
    <?php foreach($assignments_list as $a): ?>
    <div class="glass-panel card" style="margin-bottom: 20px; border-left: 5px solid var(--accent-primary);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                 <h3><i class="fas fa-file-alt"></i> <?php echo htmlspecialchars($a['title']); ?></h3>
                 <p class="text-muted">Due: <?php echo $a['due_date']; ?></p>
                 <?php if($a['file_path']): ?>
                    <a href="uploads/assignments/<?php echo $a['file_path']; ?>" download class="text-gradient">Download Attachment</a>
                 <?php endif; ?>
            </div>
            
            <?php if($role === 'student'): ?>
                 <form action="api/upload.php" method="POST" enctype="multipart/form-data" style="display: flex; align-items: center; gap: 10px;">
                    <input type="hidden" name="action" value="submit_assignment">
                    <input type="hidden" name="class_code" value="<?php echo $class_code; ?>">
                    <input type="hidden" name="assignment_id" value="<?php echo $a['id']; ?>">
                    <input type="file" name="file" required style="width: 200px; font-size: 0.8rem; color: #fff;">
                    <button type="submit" class="btn-outline">Submit</button>
                 </form>
                 <!-- Show Grade if Exists -->
                 <?php
                     $my_sub = $pdo->prepare("SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?");
                     $my_sub->execute([$a['id'], $_SESSION['user_id']]);
                     $sub = $my_sub->fetch();
                     if ($sub && $sub['grade']) {
                         echo '<span class="chip success" style="margin-left: 10px;">Grade: '.$sub['grade'].'/100</span>';
                     }
                 ?>

            <?php else: ?>
                <button onclick="toggleSubs(<?php echo $a['id']; ?>)" class="btn-outline">View Submissions</button>
            <?php endif; ?>
        </div>

        <!-- Professor: Submissions List (Hidden by default) -->
        <?php if($role === 'professor'): ?>
        <div id="subs-<?php echo $a['id']; ?>" style="display: none; margin-top: 20px; border-top: 1px solid var(--glass-border); padding-top: 20px;">
            <?php
            $subs = $pdo->prepare("
                SELECT s.*, u.name 
                FROM submissions s 
                JOIN users u ON s.student_id = u.id 
                WHERE s.assignment_id = ?
            ");
            $subs->execute([$a['id']]);
            $submissions = $subs->fetchAll();
            ?>
            
            <?php if(count($submissions) == 0): ?>
                <p class="text-muted">No submissions yet.</p>
            <?php else: ?>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="color: var(--text-muted); font-size: 0.9rem;">
                            <th style="text-align: left; padding: 5px;">Student</th>
                            <th style="text-align: left; padding: 5px;">Submitted</th>
                            <th style="text-align: left; padding: 5px;">Plagiarism</th>
                            <th style="text-align: left; padding: 5px;">File</th>
                            <th style="text-align: left; padding: 5px;">Grade</th>
                            <th style="text-align: left; padding: 5px;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach($submissions as $sub): ?>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <td style="padding: 10px 5px;"><?php echo htmlspecialchars($sub['name']); ?></td>
                            <td style="padding: 10px 5px;"><?php echo date('M d', strtotime($sub['submitted_at'])); ?></td>
                            <td style="padding: 10px 5px;">
                                <span class="chip <?php echo $sub['plagiarism_status']; ?>">
                                    <?php echo $sub['plagiarism_score']; ?>% Match
                                </span>
                            </td>
                            <td style="padding: 10px 5px;">
                                <a href="uploads/submissions/<?php echo $sub['file_path']; ?>" target="_blank" class="text-gradient"><i class="fas fa-download"></i> View</a>
                            </td>
                            <form action="api/grade_submission.php" method="POST">
                                <td style="padding: 10px 5px;">
                                    <input type="number" name="grade" max="100" class="input-glass" style="width: 60px; padding: 5px;" value="<?php echo $sub['grade']; ?>" placeholder="-">
                                </td>
                                <td style="padding: 10px 5px;">
                                    <input type="hidden" name="submission_id" value="<?php echo $sub['id']; ?>">
                                    <input type="hidden" name="class_code" value="<?php echo $class_code; ?>">
                                    <input type="text" name="feedback" class="input-glass" style="width: 150px; padding: 5px;" value="<?php echo htmlspecialchars($sub['feedback'] ?? ''); ?>" placeholder="Feedback...">
                                    <button type="submit" class="btn-glow" style="padding: 5px 10px; font-size: 0.7rem;">Save</button>
                                </td>
                            </form>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        <?php endif; ?>

    </div>
    <?php endforeach; ?>

    <h3>Notes</h3>
    <?php foreach($notes_list as $n): ?>
    <div class="glass-panel card" style="margin-bottom: 20px; border-left: 5px solid var(--accent-secondary);">
        <h3><i class="fas fa-sticky-note"></i> <?php echo htmlspecialchars($n['title']); ?></h3>
        <p class="text-muted">Uploaded: <?php echo $n['uploaded_at']; ?></p>
        <a href="uploads/notes/<?php echo $n['file_path']; ?>" download class="btn-glow" style="margin-top: 10px; font-size: 0.8rem;">Download PDF</a>
    </div>
    <?php endforeach; ?>
</div>

        <!-- People Tab -->
        <div id="people" class="tab-content fade-in">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3>Students Enrolled</h3>
                <?php if($role === 'professor'): ?>
                <a href="attendance_report.php?class_id=<?php echo $class_id; ?>" class="btn-glow" style="font-size: 0.9rem;"><i class="fas fa-file-excel"></i> Export Attendance</a>
                <?php endif; ?>
            </div>

            <ul style="margin-top: 20px;">
                <?php foreach($student_list as $s): ?>
                <li class="glass-panel" style="padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between;">
                    <span><?php echo htmlspecialchars($s['name']); ?> <small class="text-muted">(<?php echo $s['roll_no']; ?>)</small></span>
                    <span class="chip success">Active</span>
                </li>
                <?php endforeach; ?>
            </ul>
        </div>

    </div>

    <script>
        function switchTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            
            document.getElementById(tabId).classList.add('active');
            event.target.classList.add('active');
        }

        function toggleSubs(id) {
            const el = document.getElementById('subs-' + id);
            el.style.display = el.style.display === 'none' ? 'block' : 'none';
        }
    </script>
</body>
</html>
