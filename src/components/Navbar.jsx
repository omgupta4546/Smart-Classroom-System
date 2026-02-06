import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, Bell, User as UserIcon, Calendar, BookOpen } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="glass-panel" style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '95%',
            maxWidth: '1200px',
            zIndex: 1000,
            padding: '12px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: '50px'
        }}>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '35px',
                    height: '35px',
                    background: 'linear-gradient(45deg, var(--accent-primary), var(--accent-secondary))',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px var(--accent-glow)'
                }}>
                    <GraduationCap size={20} color="white" />
                </div>
                <h2 className="text-gradient" style={{ fontSize: '1.4rem', margin: 0, fontWeight: '800' }}>Smart Attendance</h2>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* Admin Link */}
                {user?.role === 'admin' && (
                    <Link to="/admin" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--accent-secondary)',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        marginRight: '10px'
                    }}>
                        <Shield size={18} /> Admin
                    </Link>
                )}

                {/* Notification Bell */}
                <div style={{ position: 'relative', cursor: 'pointer', padding: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}>
                    <Bell size={18} />
                    <div style={{
                        position: 'absolute', top: '5px', right: '5px',
                        width: '8px', height: '8px', background: 'var(--accent-secondary)',
                        borderRadius: '50%', border: '2px solid var(--bg-gradient-mid)'
                    }}></div>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', borderLeft: '1px solid var(--glass-border)', paddingLeft: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{user?.name}</span>
                        <span className={`chip ${user?.role === 'professor' ? 'warning' : 'success'}`} style={{ fontSize: '0.7rem', padding: '2px 8px', margin: 0 }}>
                            {user?.role?.toUpperCase()}
                        </span>
                    </div>

                    <button onClick={handleLogout} className="btn-glow" style={{
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        boxShadow: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <LogOut size={14} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
