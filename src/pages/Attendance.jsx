import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Camera,
    Image as ImageIcon,
    X,
    Plus,
    Search,
    CheckCircle,
    Pause,
    Play,
    Save
} from 'lucide-react';

const Attendance = () => {
    const { classCode } = useParams();
    const videoRef = useRef();
    const [imagePreview, setImagePreview] = useState(null);
    const { api } = useAuth();

    const [students, setStudents] = useState([]);
    const [present, setPresent] = useState(new Set()); // Set of IDs
    const [matcher, setMatcher] = useState(null);

    // Modes
    const [mode, setMode] = useState('camera'); // 'camera' | 'photo'
    const [isScanning, setIsScanning] = useState(false);
    const [manualSearch, setManualSearch] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            // Load Models
            const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);

            // Load Students for Class
            const res = await api.get(`/classes/${classCode}/students`);

            // Setup Matcher
            const loadedStudents = res.data.filter(s => s.isFaceRegistered);
            if (loadedStudents.length > 0) {
                const labeledDescriptors = loadedStudents.map(s => {
                    return new faceapi.LabeledFaceDescriptors(s._id, [new Float32Array(s.faceDescriptor)]);
                });
                setMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.5));
            }

            setStudents(res.data);

            // Start Camera if in camera mode
            if (mode === 'camera' && videoRef.current) startCamera();
        };
        init();
    }, [classCode]);

    // Handle Mode Switch
    useEffect(() => {
        if (mode === 'camera') {
            startCamera();
        } else {
            stopCamera();
        }
    }, [mode]);

    const startCamera = async () => {
        if (navigator.mediaDevices && videoRef.current) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                videoRef.current.srcObject = stream;
            } catch (e) {
                console.error("Camera failed", e);
            }
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    // Live AI Loop
    useEffect(() => {
        let interval;
        if (isScanning && mode === 'camera' && matcher) {
            interval = setInterval(async () => {
                if (videoRef.current) {
                    const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                        .withFaceLandmarks()
                        .withFaceDescriptors();

                    const results = detections.map(d => matcher.findBestMatch(d.descriptor));

                    results.forEach(result => {
                        if (result.label !== 'unknown') {
                            setPresent(prev => new Set(prev).add(result.label));
                        }
                    });
                }
            }, 500); // 2 FPS
        }
        return () => clearInterval(interval);
    }, [isScanning, matcher, mode]);

    // Photo Upload Handler
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview
        const imgUrl = URL.createObjectURL(file);
        setImagePreview(imgUrl);

        // Process
        const img = await faceapi.fetchImage(imgUrl);
        const detections = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptors();

        if (matcher) {
            const results = detections.map(d => matcher.findBestMatch(d.descriptor));
            let count = 0;
            results.forEach(result => {
                if (result.label !== 'unknown') {
                    setPresent(prev => new Set(prev).add(result.label));
                    count++;
                }
            });
            alert(`Processed Photo: Found ${count} students.`);
        }
    };

    // Manual Add
    const toggleStudent = (id) => {
        setPresent(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const saveAttendance = async () => {
        try {
            await api.post('/classes/mark', {
                classCode,
                studentsPresent: Array.from(present)
            });
            alert('Attendance Saved!');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert('Error saving attendance');
        }
    };

    // Filter students for manual entry
    const absentStudents = students.filter(s => !present.has(s._id) && s.name.toLowerCase().includes(manualSearch.toLowerCase()));

    return (
        <div className="content-wrapper flex-center" style={{ flexDirection: 'column', minHeight: '100vh', paddingBottom: '50px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '1000px', alignItems: 'center' }}>
                <h2 className="text-gradient">Take Attendance</h2>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '20px', padding: '5px' }}>
                    <button onClick={() => setMode('camera')} className={mode === 'camera' ? 'btn-glow' : 'btn-outline'} style={{ border: 'none', marginRight: '5px' }}>Live Camera</button>
                    <button onClick={() => setMode('photo')} className={mode === 'photo' ? 'btn-glow' : 'btn-outline'} style={{ border: 'none' }}>Upload Photo</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', width: '100%', maxWidth: '1000px', margin: '20px 0', flexWrap: 'wrap' }}>

                {/* Left Panel: Input Source */}
                <div className="glass-panel" style={{ flex: 2, padding: '10px', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {mode === 'camera' ? (
                        <video ref={videoRef} autoPlay muted style={{ width: '100%', borderRadius: '15px' }} />
                    ) : (
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            {imagePreview ? (
                                <img src={imagePreview} alt="Class" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '15px' }} />
                            ) : (
                                <div style={{ padding: '50px' }}>
                                    <ImageIcon size={48} style={{ marginBottom: '10px', color: 'var(--text-muted)' }} />
                                    <p>Upload a group photo of the class</p>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ marginTop: '20px', color: 'white' }} />
                        </div>
                    )}
                </div>

                {/* Right Panel: List & Manual */}
                <div className="glass-panel" style={{ flex: 1, padding: '20px', minWidth: '300px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CheckCircle size={20} color="var(--status-success)" /> Present: {present.size}
                    </h3>

                    <div style={{ maxHeight: '200px', overflowY: 'auto', margin: '15px 0', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                        {Array.from(present).map(id => {
                            const s = students.find(stud => stud._id === id);
                            return (
                                <div key={id} className="chip success" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', width: '100%' }}>
                                    <span>{s?.name || id}</span>
                                    <X size={14} style={{ cursor: 'pointer' }} onClick={() => toggleStudent(id)} />
                                </div>
                            )
                        })}
                    </div>

                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Search size={16} /> Manual Override
                    </h4>
                    <input
                        type="text"
                        placeholder="Search missing student..."
                        className="input-glass"
                        style={{ padding: '8px', fontSize: '0.9rem', marginBottom: '10px' }}
                        value={manualSearch}
                        onChange={(e) => setManualSearch(e.target.value)}
                    />
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {absentStudents.map(s => (
                            <div key={s._id} onClick={() => toggleStudent(s._id)} style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{s.name}</span>
                                <Plus size={14} className="text-gradient" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
                {mode === 'camera' && (
                    !isScanning ? (
                        <button onClick={() => setIsScanning(true)} className="btn-glow" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Play size={16} /> Start Scanning
                        </button>
                    ) : (
                        <button onClick={() => setIsScanning(false)} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Pause size={16} /> Pause
                        </button>
                    )
                )}
                <button onClick={saveAttendance} className="btn-glow" style={{ background: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Save size={16} /> Save Attendance
                </button>
            </div>
        </div>
    );
};

export default Attendance;
