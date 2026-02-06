import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import AnalyticsCard from '../components/AnalyticsCard';
import { Users, Book, ShieldCheck, ShieldAlert, Plus, FolderOpen } from 'lucide-react';

const Dashboard = () => {
    const { user, api } = useAuth();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [classCode, setClassCode] = useState('');
    const [newClassName, setNewClassName] = useState('');

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await api.get('/classes/my');
                setClasses(res.data);
            } catch (err) {
                console.error('Error fetching classes:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, [api]);

    const handleJoinClass = async (e) => {
        e.preventDefault();
        try {
            await api.post('/classes/join', { code: classCode });
            setShowJoinModal(false);
            setClassCode('');
            // Refresh classes
            const res = await api.get('/classes/my');
            setClasses(res.data);
        } catch (err) {
            alert(err.response?.data?.msg || 'Error joining class');
        }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            await api.post('/classes/create', { name: newClassName, code });
            setShowCreateModal(false);
            setNewClassName('');
            // Refresh classes
            const res = await api.get('/classes/my');
            setClasses(res.data);
        } catch (err) {
            alert(err.response?.data?.msg || 'Error creating class');
        }
    };

    if (loading) return <div className="flex-center" style={{ height: '80vh' }}><div className="loader"></div></div>;

    return (
        <div className="content-wrapper fade-in" style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Header Section */}
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>
                    Welcome, <span className="text-gradient">{user?.name}</span>
                </h1>
                <p className="text-muted">Manage your classes and attendance efficiently.</p>
            </div>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div className="glass-panel card" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '5rem', opacity: '0.05', transform: 'rotate(15deg)' }}>
                        <i className="fas fa-users"></i>
                    </div>
                    <h4 className="text-muted" style={{ fontSize: '0.9rem', textTransform: 'uppercase' }}>
                        {user?.role === 'professor' ? 'Total Students' : 'Avg Attendance'}
                    </h4>
                    <h2 style={{ fontSize: '2.5rem', margin: '10px 0' }}>
                        {user?.role === 'professor' ? '128' : '94%'}
                    </h2>
                    <div className="chip success">+5% from last week</div>
                </div>

                <div className="glass-panel card" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '5rem', opacity: '0.05', transform: 'rotate(15deg)' }}>
                        <i className="fas fa-book"></i>
                    </div>
                    <h4 className="text-muted" style={{ fontSize: '0.9rem', textTransform: 'uppercase' }}>My Classes</h4>
                    <h2 style={{ fontSize: '2.5rem', margin: '10px 0' }}>{classes.length}</h2>
                    <div className="chip warning">2 Active Now</div>
                </div>

                {user?.role === 'student' && (
                    <div className="glass-panel card" style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                        <h4 className="text-muted" style={{ fontSize: '0.9rem', textTransform: 'uppercase' }}>Face ID Status</h4>
                        <div style={{ margin: '15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '12px', height: '12px',
                                borderRadius: '50%',
                                background: user?.isFaceRegistered ? 'var(--status-success)' : 'var(--status-critical)',
                                boxShadow: `0 0 10px ${user?.isFaceRegistered ? 'var(--status-success)' : 'var(--status-critical)'}`
                            }}></div>
                            <span style={{ fontWeight: 'bold' }}>{user?.isFaceRegistered ? 'Verified' : 'Action Required'}</span>
                        </div>
                        {!user?.isFaceRegistered && (
                            <Link to="/face-register" className="btn-glow" style={{ width: '100%', display: 'block', textAlign: 'center', padding: '10px' }}>Setup Face ID</Link>
                        )}
                    </div>
                )}
            </div>

            {/* Analytics Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <AnalyticsCard
                    title={user?.role === 'professor' ? 'Daily Attendance Trend' : 'My Attendance Over Time'}
                    type="area"
                />
                <AnalyticsCard
                    title={user?.role === 'professor' ? 'Enrollment Growth' : 'Class Engagement'}
                    type="line"
                />
            </div>

            {/* Classes Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Book size={24} color="var(--accent-primary)" /> My Classes
                </h3>
                {user?.role === 'professor' ? (
                    <button className="btn-glow" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} /> Create Class
                    </button>
                ) : (
                    <button className="btn-glow" onClick={() => setShowJoinModal(true)}>
                        <Plus size={18} /> Join Class
                    </button>
                )}
            </div>

            {classes.length === 0 ? (
                <div role="status" className="glass-panel flex-center" style={{ padding: '60px', flexDirection: 'column', gap: '20px' }}>
                    <FolderOpen size={48} style={{ opacity: '0.2' }} />
                    <p className="text-muted">No classes found. Get started by joining or creating one!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
                    {classes.map((cls) => (
                        <Link to={`/classroom/${cls.code}`} key={cls._id} className="glass-panel card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{
                                height: '100px',
                                background: 'linear-gradient(45deg, var(--accent-primary), var(--accent-secondary))',
                                position: 'relative'
                            }}>
                                <span style={{
                                    position: 'absolute', bottom: '15px', right: '20px',
                                    background: 'rgba(0,0,0,0.3)', padding: '5px 12px',
                                    borderRadius: '50px', fontSize: '0.8rem', color: 'white'
                                }}>#{cls.code}</span>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <h3 style={{ margin: '0 0 5px 0' }}>{cls.name}</h3>
                                <p className="text-muted" style={{ fontSize: '0.9rem' }}>Prof. {cls.professorName || 'Dr. Pankaj Sharma'}</p>
                                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Users size={16} color="var(--accent-primary)" />
                                        <span style={{ fontSize: '0.8rem' }}>{cls.students?.length || 0} Students</span>
                                    </div>
                                    <div className="btn-glow" style={{ padding: '5px 15px', fontSize: '0.7rem' }}>ENTER</div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Modals */}
            {showJoinModal && (
                <div className="flex-center" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 2000 }}>
                    <div className="glass-panel" style={{ padding: '40px', maxWidth: '400px', width: '90%' }}>
                        <h2>Join Class</h2>
                        <p className="text-muted" style={{ marginBottom: '20px' }}>Enter the 6-character class code.</p>
                        <form onSubmit={handleJoinClass}>
                            <input
                                type="text" className="input-glass" placeholder="e.g. AB12CD"
                                value={classCode} onChange={(e) => setClassCode(e.target.value)}
                                required maxLength="6" style={{ textAlign: 'center', letterSpacing: '5px', fontSize: '1.5rem', marginBottom: '20px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" className="btn-glow btn-outline" onClick={() => setShowJoinModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn-glow" style={{ flex: 1 }}>Join</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <div className="flex-center" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 2000 }}>
                    <div className="glass-panel" style={{ padding: '40px', maxWidth: '400px', width: '90%' }}>
                        <h2>Create Class</h2>
                        <p className="text-muted" style={{ marginBottom: '20px' }}>Enter the name for your new classroom.</p>
                        <form onSubmit={handleCreateClass}>
                            <input
                                type="text" className="input-glass" placeholder="e.g. Data Structures"
                                value={newClassName} onChange={(e) => setNewClassName(e.target.value)}
                                required style={{ marginBottom: '20px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" className="btn-glow btn-outline" onClick={() => setShowCreateModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn-glow" style={{ flex: 1 }}>Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Dashboard;
