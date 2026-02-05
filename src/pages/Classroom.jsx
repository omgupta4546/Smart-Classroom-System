import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Classroom = () => {
    const { classCode } = useParams();
    const { user, api } = useAuth();
    const [activeTab, setActiveTab] = useState('stream');
    const [classData, setClassData] = useState(null);
    const [students, setStudents] = useState([]);

    useEffect(() => {
        // Mock loading class data (replace with API)
        setClassData({ name: 'Advanced AI', code: classCode, professor: 'Dr. Smith' });

        // Load Students
        const loadStudents = async () => {
            try {
                // Endpoint doesn't exist yet in my mock backend (I created /:classCode/students though)
                const res = await api.get(`/classes/${classCode}/students`);
                setStudents(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        if (user.role === 'professor') loadStudents();

    }, [classCode]);

    return (
        <div className="content-wrapper" style={{ padding: '20px 5%' }}>
            {/* Banner */}
            <div className="glass-panel" style={{ background: 'linear-gradient(to right, var(--bg-gradient-mid), var(--bg-gradient-start))', padding: '60px 5% 30px', borderBottom: '1px solid var(--glass-border)', borderRadius: '0 0 24px 24px', marginTop: '60px' }}>
                <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}><i className="fas fa-book-open"></i> {classData?.name} ({classData?.code})</h1>
                <p className="text-muted">Prof. {classData?.professor}</p>
            </div>

            {/* Tabs */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0 5%', display: 'flex', gap: '10px', marginTop: '20px', borderRadius: '12px' }}>
                {['stream', 'classwork', 'people'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: activeTab === tab ? 'white' : 'var(--text-muted)',
                            padding: '15px 30px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent'
                        }}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ marginTop: '20px' }}>
                {activeTab === 'stream' && (
                    <div className="glass-panel" style={{ padding: '20px' }}>
                        <h3>Stream</h3>
                        <p className="text-muted">No announcements yet.</p>
                    </div>
                )}

                {activeTab === 'people' && (
                    <div className="glass-panel" style={{ padding: '20px' }}>
                        <h3>Students</h3>
                        <ul style={{ marginTop: '15px' }}>
                            {students.map(s => (
                                <li key={s._id} style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>
                                    {s.name} {s.isFaceRegistered ? '✅' : '❌'}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Classroom;
