import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, Bell, User as UserIcon, Calendar, BookOpen, Shield, CheckCircle, Info, AlertCircle, X } from 'lucide-react';

const Navbar = () => {
    const { user, logout, api } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error('Error marking read:', err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Error marking all read:', err);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getIcon = (type) => {
        switch (type) {
            case 'attendance': return <CheckCircle size={14} className="text-success" />;
            case 'absence': return <AlertCircle size={14} className="text-critical" />;
            case 'class': return <BookOpen size={14} className="text-warning" />;
            default: return <Info size={14} className="text-primary" />;
        }
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
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <div
                        onClick={() => setShowNotifications(!showNotifications)}
                        style={{ position: 'relative', cursor: 'pointer', padding: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <div style={{
                                position: 'absolute', top: '5px', right: '5px',
                                width: '12px', height: '12px', background: 'var(--accent-secondary)',
                                borderRadius: '50%', border: '2px solid var(--bg-gradient-mid)',
                                fontSize: '8px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                            }}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </div>
                        )}
                    </div>

                    {showNotifications && (
                        <div
                            ref={dropdownRef}
                            style={{
                                position: 'absolute', top: '100%', right: '0', marginTop: '15px',
                                width: '380px', background: '#0f172a', border: '1px solid #1e293b',
                                borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                                padding: '20px', zIndex: '1000'
                            }}
                            className="fade-in"
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>Notifications</h3>
                                {notifications.filter(n => !n.isRead).length > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '15px', paddingRight: '5px' }}>
                                {notifications.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '30px 0', opacity: '0.5' }}>
                                        <Bell size={24} style={{ marginBottom: '10px' }} />
                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>No notifications</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n._id}
                                            onClick={() => {
                                                markAsRead(n._id);
                                                if (n.link) navigate(n.link);
                                                setShowNotifications(false);
                                            }}
                                            style={{
                                                padding: '12px 15px', borderRadius: '12px', marginBottom: '8px',
                                                background: n.isRead ? 'rgba(255,255,255,0.03)' : 'rgba(99, 102, 241, 0.1)',
                                                border: '1px solid', borderColor: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.2)',
                                                cursor: 'pointer', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px',
                                                alignItems: 'start', transition: '0.3s'
                                            }}
                                        >
                                            <div style={{ marginTop: '3px' }}>{getIcon(n.type)}</div>
                                            <div>
                                                <p style={{ margin: '0 0 2px 0', fontSize: '0.9rem', fontWeight: 'bold', color: 'white' }}>{n.title}</p>
                                                <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>{n.message}</p>
                                                <span style={{ fontSize: '0.7rem', opacity: '0.4' }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '10px', textAlign: 'center' }}>
                                <Link
                                    to="/notifications"
                                    onClick={() => setShowNotifications(false)}
                                    style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 'bold', textDecoration: 'none' }}
                                >
                                    View All Notifications
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', borderLeft: '1px solid var(--glass-border)', paddingLeft: '20px' }}>
                    <Link to="/profile" style={{ display: 'flex', gap: '15px', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{user?.name}</span>
                            <span className={`chip ${user?.role === 'professor' ? 'warning' : 'success'}`} style={{ fontSize: '0.7rem', padding: '2px 8px', margin: 0 }}>
                                {user?.role?.toUpperCase()}
                            </span>
                        </div>
                    </Link>

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
