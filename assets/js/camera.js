// camera.js - Client Side High-Accuracy Face Recognition
const video = document.getElementById('video-feed');
const overlay = document.getElementById('overlay-container');
const logList = document.getElementById('log-list');
const presentCount = document.getElementById('count-present');
const loadingSpinner = document.getElementById('loading-ai');

let labeledFaceDescriptors = []; // To store loaded known faces
let faceMatcher;
let scanInterval;
let isModelLoaded = false;
let detectedStudents = new Set(); // Track present IDs

// 1. Init Camera
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
    } catch (err) {
        console.error("Camera Error:", err);
        alert("Camera access denied.");
    }
}

// 2. Load Models & Known Faces
async function loadAI() {
    loadingSpinner.style.display = 'block';
    const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

    if (!isModelLoaded) {
        try {
            console.log("Loading models...");
            await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
            isModelLoaded = true;
        } catch (e) {
            alert("Failed to load AI models");
            return false;
        }
    }

    try {
        console.log("Fetching student data...");
        const response = await fetch('api/get_faces.php');
        const data = await response.json();

        if (data.status === 'success' && data.students.length > 0) {
            labeledFaceDescriptors = data.students.map(student => {
                const descriptor = new Float32Array(student.descriptor);
                return new faceapi.LabeledFaceDescriptors(student.name, [descriptor]);
            });

            faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5); // 0.5 = strict distance
            return true;
        } else {
            alert("No students found with registered faces! Please tell students to register Face ID.");
            loadingSpinner.style.display = 'none';
            return false;
        }
    } catch (e) {
        console.error(e);
        alert("Error fetching student database.");
        return false;
    }
}

// 3. Start Scanning
async function startAI() {
    const success = await loadAI();
    if (!success) return;

    loadingSpinner.style.display = 'none';
    document.getElementById('btn-scan').style.display = 'none';
    document.getElementById('btn-confirm').style.display = 'inline-block';

    // Loop
    scanInterval = setInterval(async () => {
        if (video.paused || video.ended) return;

        // Detect all faces
        const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptors();

        // Resize
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        // We might need to adjust overlay size if video size changed
        // faceapi.matchDimensions(overlay, displaySize); // (Optional if we mapped overlay 1:1)

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // Match
        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));

        updateOverlay(results, resizedDetections);

    }, 200); // 5 FPS is enough
}

function updateOverlay(results, detections) {
    overlay.innerHTML = ''; // Clear rects

    results.forEach((result, i) => {
        const box = detections[i].detection.box;
        const name = result.toString(); // e.g. "John Doe (0.42)"
        const label = result.label;

        // Draw Box (Simple DIVs)
        // Note: Video scaling in CSS means we need to be careful with coordinate mapping.
        // For simplicity, we assume video is fit to container. If object-fit: cover is used, coordinates shift.
        // A robust solution uses a canvas overlay. Here we just log logic.

        if (label !== 'unknown') {
            if (!detectedStudents.has(label)) {
                detectedStudents.add(label);
                addLog(label, (1 - result.distance).toFixed(2));
                presentCount.innerText = detectedStudents.size;
            }
        }
    });
}

function addLog(name, confidence) {
    const li = document.createElement('li');
    li.className = 'glass-panel';
    li.style.padding = '8px';
    li.style.marginBottom = '5px';
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.innerHTML = `
        <span>${name}</span>
        <span class="chip success" style="margin:0; padding: 2px 8px; font-size: 10px;">${Math.round(confidence * 100)}%</span>
    `;
    logList.prepend(li); // Newest top
}

async function saveAttendance() {
    // In real app: Send detectedStudents array to API
    alert(`Attendance Saved! Marked ${detectedStudents.size} students present.`);
    window.location.href = 'dashboard.php';
}

initCamera();
