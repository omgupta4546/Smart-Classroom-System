import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const FaceRegister = () => {
    const videoRef = useRef();
    const [isLoading, setIsLoading] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);
    const { api } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
            await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
            setModelLoaded(true);
            startVideo();
        };
        loadModels();
    }, []);

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => { videoRef.current.srcObject = stream; })
            .catch(err => console.error(err));
    };

    const capture = async () => {
        setIsLoading(true);
        const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (detections) {
            const descriptor = Array.from(detections.descriptor);
            try {
                await api.post('/classes/face/register', { descriptor });
                alert('Face Registered Successfully!');
                navigate('/dashboard');
            } catch (err) {
                alert('Failed to save face data.');
            }
        } else {
            alert('No face detected. Please try again.');
        }
        setIsLoading(false);
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
            <h2 className="text-gradient" style={{ marginBottom: '20px' }}>Setup Face ID</h2>
            <div className="glass-panel" style={{ padding: '10px', borderRadius: '20px', overflow: 'hidden' }}>
                <video ref={videoRef} autoPlay muted width="640" height="480" style={{ borderRadius: '15px' }} />
            </div>
            <div style={{ marginTop: '20px' }}>
                {!modelLoaded ? (
                    <p className="text-muted">Loading AI Models...</p>
                ) : (
                    <button onClick={capture} disabled={isLoading} className="btn-glow">
                        {isLoading ? 'Scanning...' : 'Capture & Save'}
                    </button>
                )}
            </div>
            <button onClick={() => navigate('/dashboard')} className="btn-outline" style={{ marginTop: '20px' }}>Back</button>
        </div>
    );
};

export default FaceRegister;
