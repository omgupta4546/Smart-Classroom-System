import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const FaceRegister = () => {
    const videoRef = useRef();
    const canvasRef = useRef();
    const [isLoading, setIsLoading] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);
    const { api } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelLoaded(true);
                startVideo();
            } catch (err) {
                console.error("Failed to load models:", err);
                alert("Failed to load AI models. Please check your internet connection.");
            }
        };
        loadModels();
    }, []);

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                videoRef.current.srcObject = stream;
            })
            .catch(err => console.error(err));
    };

    const handleVideoPlay = () => {
        setInterval(async () => {
            if (canvasRef.current && videoRef.current) {
                const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
                faceapi.matchDimensions(canvasRef.current, displaySize);

                const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                    .withFaceLandmarks();

                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                if (detections) {
                    const resizedDetections = faceapi.resizeResults(detections, displaySize);
                    faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
                    faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
                }
            }
        }, 100);
    };

    const capture = async () => {
        setIsLoading(true);
        // Increased confidence for better accuracy
        const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 }))
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
            alert('Face not detected clearly. Please ensure your face is well-lit and centered.');
        }
        setIsLoading(false);
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', padding: '20px' }}>
            <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2 className="text-gradient" style={{ marginBottom: '10px', fontSize: '2rem' }}>Face Identity Setup</h2>
                    <p className="text-muted">Ensure your face is clearly visible in the frame.</p>
                </div>

                <div style={{
                    position: 'relative',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: '2px solid var(--accent-primary)',
                    boxShadow: '0 0 30px rgba(99, 102, 241, 0.2)'
                }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        width="640"
                        height="480"
                        onPlay={handleVideoPlay}
                        style={{ display: 'block' }}
                    />
                    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                </div>

                <div style={{ display: 'flex', gap: '15px', width: '100%', justifyContent: 'center' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn-outline"
                    >
                        Cancel
                    </button>

                    {!modelLoaded ? (
                        <button disabled className="btn-glow" style={{ opacity: 0.6 }}>
                            Loading AI...
                        </button>
                    ) : (
                        <button
                            onClick={capture}
                            disabled={isLoading}
                            className="btn-glow"
                        >
                            {isLoading ? 'Processing...' : 'Capture & Save'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FaceRegister;
