<?php
session_start();
if ($_SESSION['role'] !== 'student') {
    header("Location: dashboard.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Face ID Setup | Antigravity</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <?php include 'includes/navbar.php'; ?>

    <div class="content-wrapper flex-center" style="min-height: 90vh; flex-direction: column; padding-top: 80px;">
        
        <div class="glass-panel" style="padding: 30px; width: 90%; max-width: 600px; text-align: center;">
            <h2 style="margin-bottom: 10px;">Setup Face ID</h2>
            <p class="text-muted" style="margin-bottom: 30px;">We need to scan your face to enable AI attendance.</p>

            <!-- Camera Container -->
            <div id="camera-container" style="width: 100%; height: 300px; background: rgba(0,0,0,0.5); border-radius: 20px; position: relative; overflow: hidden; margin-bottom: 20px; border: 2px dashed rgba(255,255,255,0.2);">
                <video id="video" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
                <div id="scan-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: none; background: rgba(99, 102, 241, 0.2);">
                     <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 200px; height: 200px; border: 4px solid var(--accent-primary); border-radius: 50%; box-shadow: 0 0 50px var(--accent-primary);"></div>
                     <p style="position: absolute; bottom: 20px; width: 100%; text-align: center; color: white; font-weight: bold;">Scanning...</p>
                </div>
            </div>

            <!-- Progress -->
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span id="progress-text">0/10 Images</span>
                    <span id="progress-percent">0%</span>
                </div>
                <div style="background: rgba(255,255,255,0.1); height: 10px; border-radius: 5px; overflow: hidden;">
                    <div id="progress-bar" style="width: 0%; height: 100%; background: var(--accent-secondary); transition: width 0.3s; box-shadow: 0 0 10px var(--accent-secondary);"></div>
                </div>
            </div>

            <button id="start-btn" class="btn-glow" onclick="startScanning()"><i class="fas fa-camera"></i> Start Camera</button>
            <button id="capture-btn" class="btn-glow" onclick="captureImages()" style="display: none;"><i class="fas fa-expand"></i> Capture</button>
            
            <form id="complete-form" action="dashboard.php" style="display: none; margin-top: 20px;">
                <div class="chip success" style="margin-bottom: 15px;">Face Data Registered!</div>
                <button type="submit" class="btn-glow" style="width: 100%;">Return to Dashboard</button>
            </form>
        </div>
    </div>

    <!-- Load face-api.js -->
    <script src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script>

    <script>
        const video = document.getElementById('video');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const overlay = document.getElementById('scan-overlay');
        
        let isModelLoaded = false;

        // Load Models
        async function loadModels() {
            progressText.innerText = "Loading High-Accuracy AI Models...";
            try {
                // Determine base URL for GitHub Pages or similar if local fails, but local + internet is best
                const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
                
                // Load SSD MobileNet V1 (Best Accuracy)
                await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL); // Only needed for descriptor
                
                isModelLoaded = true;
                progressText.innerText = "High-Accuracy Models Loaded. Ready.";
            } catch (err) {
                console.error(err);
                alert("Failed to load AI models. Check internet connection.");
            }
        }
        
        // Start Camera
        async function startScanning() {
            if (!isModelLoaded) await loadModels();
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                video.srcObject = stream;
                document.getElementById('start-btn').style.display = 'none';
                document.getElementById('capture-btn').style.display = 'inline-block';
            } catch (err) {
                alert("Camera access denied: " + err);
            }
        }

        async function captureImages() {
            const captureBtn = document.getElementById('capture-btn');
            captureBtn.disabled = true;
            captureBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
            overlay.style.display = 'block';

            // Detect Face
            // Using SSD MobileNet V1 for BEST ACCURACY
            const detections = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })).withFaceLandmarks().withFaceDescriptor();
            
            if (!detections) {
                alert("No face detected! Please ensure good lighting and look at the camera.");
                resetUI();
                return;
            }

            // We have the descriptor (Float32Array)
            // Convert to regular array for JSON serialization
            const descriptor = Array.from(detections.descriptor);
            
            await saveFaceDescriptor(descriptor);
        }

        async function saveFaceDescriptor(descriptor) {
            progressText.innerText = "Saving Face ID...";
            
            try {
                const response = await fetch('api/register_face.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ descriptor: descriptor })
                });

                const data = await response.json();

                if (response.ok && data.status === 'success') {
                   showSuccess();
                } else {
                    alert("Error: " + (data.error || "Unknown Error"));
                    resetUI();
                }

            } catch (err) {
                alert("Network Error: " + err);
                resetUI();
            }
        }

        function showSuccess() {
            document.getElementById('capture-btn').style.display = 'none';
            document.getElementById('camera-container').style.border = "2px solid var(--status-success)";
            document.getElementById('complete-form').style.display = 'block';
            overlay.style.display = 'none';
            progressText.innerText = "Complete!";
            
            // Stop Camera
            if(video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
            }
        }

        function resetUI() {
            document.getElementById('capture-btn').disabled = false;
            document.getElementById('capture-btn').innerHTML = '<i class="fas fa-expand"></i> Capture';
            overlay.style.display = 'none';
            progressText.innerText = "0/10 Images"; // Reset text
        }

        // Init
        window.onload = loadModels;
    </script>
</body>
</html>
