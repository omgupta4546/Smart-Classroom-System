import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    CheckCircle,
    Info,
    AlertCircle,
    Trash2,
    CheckCheck,
    ChevronRight,
    Search,
    Filter,
    BookOpen
} from 'lucide-react';

const Notifications = () => {
    const { user, api } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
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

    const deleteNotification = async (id, e) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'attendance': return <CheckCircle size={20} className="text-success" />;
            case 'absence': return <AlertCircle size={20} className="text-critical" />;
            case 'class': return <BookOpen size={20} className="text-warning" />;
            default: return <Info size={20} className="text-primary" />;
        }
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter = filter === 'all' || n.type === filter;
        const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.message.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (loading) return <div className="flex-center" style={{ height: '80vh' }}><div className="loader"></div></div>;

    return (
        <div className="content-wrapper fade-in" style={{ padding: '60px 20px', maxWidth: '1000px', margin: '0 auto' }}>

            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px' }}>
                <div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '10px', letterSpacing: '-1px', color: 'white' }}>
                        Notifications
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: '#94a3b8' }}>
                        You have <span style={{ color: '#818cf8', fontWeight: 'bold' }}>{unreadCount}</span> unread alerts
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} className="btn-glow" style={{ padding: '10px 20px', fontSize: '0.8rem' }}>
                            <Bell size={16} /> MARK ALL AS READ
                        </button>
                    )}
                </div>
            </div>

            {/* Controls Section */}
            <div style={{ padding: '20px 30px', borderRadius: '24px', marginBottom: '40px', display: 'flex', gap: '25px', alignItems: 'center', flexWrap: 'wrap', background: '#0f172a', border: '1px solid #1e293b', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', opacity: '0.4' }} />
                    <input
                        className="input-glass"
                        placeholder="Search your alerts..."
                        style={{ paddingLeft: '50px', width: '100%', background: 'rgba(255,255,255,0.03)' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Filter size={20} className="text-muted" />
                    <select
                        className="input-glass"
                        style={{ padding: '10px 20px', width: '180px', background: 'rgba(255,255,255,0.03)' }}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">Everything</option>
                        <option value="attendance">Attendance</option>
                        <option value="absence">Absences</option>
                        <option value="class">Class News</option>
                        <option value="assignment">Assignments</option>
                        <option value="note">Study Material</option>
                    </select>
                </div>
            </div>

            {/* Notifications List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filteredNotifications.length === 0 ? (
                    <div style={{ padding: '100px', flexDirection: 'column', gap: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px' }}>
                        <Bell size={64} style={{ opacity: '0.1', color: 'var(--accent-primary)' }} />
                        <p className="text-muted" style={{ fontSize: '1.2rem' }}>All caught up! No notifications found.</p>
                    </div>
                ) : (
                    filteredNotifications.map((n, index) => (
                        <div
                            key={n._id}
                            onClick={() => {
                                markAsRead(n._id);
                                if (n.link) navigate(n.link);
                            }}
                            className="glass-panel card fade-in"
                            style={{
                                padding: '25px 35px',
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr auto',
                                gap: '30px',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                background: n.isRead ? '#111827' : '#1e1b4b',
                                border: n.isRead ? '1px solid #1f2937' : '1px solid #6366f1',
                                position: 'relative',
                                opacity: n.isRead ? 0.9 : 1,
                                animationDelay: `${index * 0.05}s`,
                                boxShadow: n.isRead ? 'none' : '0 10px 40px -10px rgba(99, 102, 241, 0.5)'
                            }}
                        >
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '20px',
                                background: n.isRead ? 'rgba(255,255,255,0.03)' : 'rgba(99, 102, 241, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                {getIcon(n.type)}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>{n.title}</h4>
                                    <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                                        {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '1rem', color: '#e2e8f0', lineHeight: '1.5' }}>{n.message}</p>
                            </div>

                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <button
                                    onClick={(e) => deleteNotification(n._id, e)}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '15px',
                                        background: 'rgba(239, 68, 68, 0.05)',
                                        border: '1px solid rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        transition: '0.3s'
                                    }}
                                    className="delete-hover"
                                    title="Dismiss"
                                >
                                    <Trash2 size={18} />
                                </button>
                                {n.link && <ChevronRight size={24} style={{ opacity: 0.3 }} />}
                            </div>

                            {!n.isRead && (
                                <div style={{
                                    position: 'absolute', top: '20px', right: '20px',
                                    width: '12px', height: '12px', background: 'var(--accent-secondary)', borderRadius: '50%',
                                    boxShadow: '0 0 15px var(--accent-secondary)'
                                }}></div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
