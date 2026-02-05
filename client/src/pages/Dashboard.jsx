import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="content-wrapper" style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="text-gradient">AI Classroom</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span>{user?.name} ({user?.role})</span>
                    <button onClick={logout} className="btn-glow" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Logout</button>
                </div>
            </div>

            <h2 style={{ marginBottom: '20px' }}>Dashboard</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div className="glass-panel card">
                    <h3>My Classes</h3>
                    <p className="text-muted" style={{ marginTop: '10px' }}>You are not enrolled in any classes yet.</p>
                </div>

                <div className="glass-panel card">
                    <h3>Attendance</h3>
                    <div className="flex-center" style={{ height: '100px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--status-success)' }}>100%</span>
                    </div>
                </div>

                {user?.role === 'student' && (
                    <div className="glass-panel card" style={{ borderLeft: '5px solid var(--accent-secondary)' }}>
                        <h3>Face ID</h3>
                        <p className="text-muted" style={{ marginBottom: '15px' }}>Register your face for AI attendance.</p>
                        <button className="btn-glow" style={{ width: '100%' }}>Setup Face ID</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
