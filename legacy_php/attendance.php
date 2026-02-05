<?php
session_start();
if ($_SESSION['role'] !== 'professor') header("Location: dashboard.php");
// Mock class data or get from GET param
$class_code = isset($_GET['class_code']) ? $_GET['class_code'] : 'AI-101'; 
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Smart Attendance | Antigravity</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .cam-controls {
            position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
            display: flex; gap: 20px; z-index: 10;
        }
        .detected-overlay {
            position: absolute; border: 2px solid var(--status-success); border-radius: 8px;
            box-shadow: 0 0 15px var(--status-success);
            transition: all 0.2s; pointer-events: none;
        }
        .name-tag {
            background: rgba(16, 185, 129, 0.8); color: white; padding: 2px 8px; font-size: 12px;
            position: absolute; top: -25px; left: 0; border-radius: 4px; white-space: nowrap;
        }
    </style>
</head>
<body>
    <!-- Load face-api.js -->
    <script src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script>
    <?php include 'includes/navbar.php'; ?>

    <div class="content-wrapper flex-center" style="flex-direction: column; padding-top: 20px; min-height: 100vh;">
        
        <div style="width: 95%; max-width: 1000px; display: flex; gap: 20px; flex-wrap: wrap;">
            
            <!-- Camera Feed -->
            <div class="glass-panel" style="flex: 2; height: 500px; position: relative; overflow: hidden; border-radius: 20px;">
                <video id="video-feed" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
                
                <!-- Mock Overlay Container for rects -->
                <div id="overlay-container" style="position: absolute; top:0; left:0; width:100%; height:100%;"></div>

                <div class="cam-controls">
                    <button id="btn-scan" class="btn-glow" style="font-size: 1.2rem; padding: 15px 30px;" onclick="startAI()"><i class="fas fa-expand"></i> SCAN CLASS</button>
                    <button id="btn-confirm" class="btn-glow" style="display: none; background: var(--status-success); box-shadow: 0 0 15px rgba(16,185,129,0.5);" onclick="saveAttendance()"><i class="fas fa-check"></i> CONFIRM</button>
                </div>

                <div id="loading-ai" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: none;">
                    <div style="width: 80px; height: 80px; border: 5px solid rgba(255,255,255,0.1); border-top: 5px solid var(--accent-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="text-align: center; margin-top: 10px; font-weight: bold;">Processing...</p>
                </div>
            </div>

            <!-- Live Stats Sidebar -->
            <div class="glass-panel" style="flex: 1; height: 500px; min-width: 300px; padding: 20px; overflow-y: auto;">
                <h3 style="margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                    <i class="fas fa-users text-gradient"></i> Real-time Feed
                </h3>

                <div id="stats-summary" style="margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div class="glass-panel" style="padding: 10px; text-align: center; background: rgba(0,0,0,0.2);">
                        <h2 id="count-present" style="color: var(--status-success);">0</h2>
                        <small class="text-muted">Present</small>
                    </div>
                     <div class="glass-panel" style="padding: 10px; text-align: center; background: rgba(0,0,0,0.2);">
                        <h2 id="count-absent" style="color: var(--status-critical);">0</h2>
                        <small class="text-muted">Absent</small>
                    </div>
                </div>

                <h4 style="margin-bottom: 10px;">Detected Log</h4>
                <ul id="log-list" style="font-size: 0.9rem;">
                    <!-- Items appended via JS -->
                </ul>
            </div>

        </div>
    </div>

    <style> @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } </style>
    <script src="assets/js/camera.js"></script>
</body>
</html>
