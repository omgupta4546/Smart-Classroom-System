import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AnalyticsCard from '../components/AnalyticsCard';
import {
    Users,
    Shield,
    Trash2,
    BookOpen,
    Database,
    Search,
    UserPlus,
    UserMinus,
    AlertCircle
} from 'lucide-react';

const AdminPanel = () => {
    const { api } = useAuth();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('users');
    const [logs, setLogs] = useState([]); // Audit Logs State
    const { user } = useAuth(); // Get user to check role

    // Super Admin State
    const [institutions, setInstitutions] = useState([]);
    const [newInst, setNewInst] = useState({ name: '', code: '', address: '' });
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', institutionId: '' });
    const [userAnalytics, setUserAnalytics] = useState([]);
    const [attendanceAnalytics, setAttendanceAnalytics] = useState([]);

    useEffect(() => {
        const fetchAdminData = async () => {
            console.log("Fetching Admin Data...");
            try {
                if (user?.role === 'super_admin') {
                    try {
                        const res = await api.get('/institutions/all');
                        setInstitutions(res.data);
                    } catch (err) {
                        console.error('Failed to fetch institutions for super admin', err);
                    }
                    // Super admin might want to see global stats or select an institution to view
                    // For now, let's just fetch global users/classes/stats
                }

                const [statsRes, usersRes, classesRes, logsRes, userAnalyticsRes, attendanceAnalyticsRes] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/users'),
                    api.get('/admin/classes'),
                    api.get('/logs'),
                    api.get('/admin/analytics/users'),
                    api.get('/admin/analytics/attendance')
                ]);
                console.log("Admin Data Fetched:", { stats: statsRes.data, users: usersRes.data });
                setStats(statsRes.data);
                setUsers(usersRes.data);
                setClasses(classesRes.data);
                setLogs(logsRes.data);
                setUserAnalytics(userAnalyticsRes.data);
                setAttendanceAnalytics(attendanceAnalyticsRes.data);
            } catch (err) {
                console.error('Failed to fetch admin data', err);
                alert("Failed to load admin data. Check console for details.");
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, [api, user]);

    const createInstitution = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/institutions/create', newInst);
            alert('Institution Created');
            window.location.reload();
        } catch (err) {
            alert('Failed to create institution');
        }
    };

    const createCollegeAdmin = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/institutions/add-admin', newAdmin);
            alert('College Admin Created');
            window.location.reload();
        } catch (err) {
            alert('Failed to create admin');
        }
    };

    const deleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            await api.delete(`/api/admin/user/${id}`);
            setUsers(users.filter(u => u._id !== id));
            // Update stats
            setStats(prev => ({
                ...prev,
                users: { ...prev.users, total: prev.users.total - 1 }
            }));
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    if (loading) return (
        <div className="flex-center" style={{ height: '80vh', flexDirection: 'column', gap: '20px' }}>
            <div className="loader"></div>
            <div style={{ color: 'var(--text-muted)' }}>Loading Admin Panel...</div>
        </div>
    );

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredClasses = classes.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="content-wrapper fade-in" style={{ padding: '40px 5%' }}>

            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Shield size={40} color="var(--accent-secondary)" /> Admin Oversight
                </h1>
                <p className="text-muted">Global system management and auditing tools.</p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div className="glass-panel card" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ background: 'rgba(var(--accent-primary-rgb), 0.1)', padding: '15px', borderRadius: '15px' }}>
                        <Users size={30} color="var(--accent-primary)" />
                    </div>
                    <div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>Total Users</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.users.total}</div>
                    </div>
                </div>
                <div className="glass-panel card" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ background: 'rgba(var(--accent-secondary-rgb), 0.1)', padding: '15px', borderRadius: '15px' }}>
                        <BookOpen size={30} color="var(--accent-secondary)" />
                    </div>
                    <div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>Active Classes</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.classes}</div>
                    </div>
                </div>
                <div className="glass-panel card" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ background: 'rgba(255,107,107, 0.1)', padding: '15px', borderRadius: '15px' }}>
                        <Database size={30} color="#ff6b6b" />
                    </div>
                    <div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>Attendance Logs</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.attendanceLogs}</div>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="glass-panel" style={{ padding: '5px', borderRadius: '15px', display: 'inline-flex', gap: '5px', marginBottom: '30px' }}>
                {['users', 'classes', 'analytics', 'audit', ...(user?.role === 'super_admin' ? ['institutions'] : [])].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 25px',
                            borderRadius: '12px',
                            border: 'none',
                            background: activeTab === tab ? 'var(--accent-primary)' : 'transparent',
                            color: activeTab === tab ? 'white' : 'var(--text-muted)',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Management Section */}
            <div className="glass-panel" style={{ padding: '30px' }}>

                {activeTab !== 'analytics' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <h2 style={{ textTransform: 'capitalize' }}>Manage {activeTab}</h2>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                            <input
                                type="text"
                                className="input-glass"
                                placeholder={`Search ${activeTab}...`}
                                style={{ paddingLeft: '45px', width: '300px' }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--accent-primary)' }}>
                                    <th style={{ padding: '15px' }}>User</th>
                                    <th style={{ padding: '15px' }}>Role</th>
                                    <th style={{ padding: '15px' }}>Created</th>
                                    <th style={{ padding: '15px' }}>Status</th>
                                    <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '15px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }} className="flex-center">
                                                    {user.profilePic ? (
                                                        <img src={user.profilePic} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <Users size={20} style={{ opacity: 0.2 }} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                                                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{user.email}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', fontWeight: 'bold' }}>
                                                        {user.institutionId?.name || 'Default University'}
                                                    </div>
                                                    {user.role === 'student' && (
                                                        <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                                                            {user.universityRollNo && `Uni Roll: ${user.universityRollNo}`}
                                                            {user.universityRollNo && user.classRollNo && ' | '}
                                                            {user.classRollNo && `Class Roll: ${user.classRollNo}`}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <div className={`chip ${user.role === 'professor' ? 'warning' : user.role === 'admin' ? 'critical' : 'success'}`}>
                                                {user.role.toUpperCase()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '15px' }}>
                                            {user.isFaceRegistered ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--status-success)', fontSize: '0.8rem' }}>
                                                    <Shield size={12} /> Verified
                                                </div>
                                            ) : (
                                                <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>Unverified</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'right' }}>
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => deleteUser(user._id)}
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ff6b6b' }}
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'classes' && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--accent-secondary)' }}>
                                    <th style={{ padding: '15px' }}>Class Name</th>
                                    <th style={{ padding: '15px' }}>Code</th>
                                    <th style={{ padding: '15px' }}>Professor</th>
                                    <th style={{ padding: '15px' }}>Students</th>
                                    <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClasses.map(cls => (
                                    <tr key={cls._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '15px', fontWeight: 'bold' }}>{cls.name}</td>
                                        <td style={{ padding: '15px' }}><div className="chip">#{cls.code}</div></td>
                                        <td style={{ padding: '15px' }}>{cls.professor?.name || 'Unknown'}</td>
                                        <td style={{ padding: '15px' }}>{cls.students.length} Enrolled</td>
                                        <td style={{ padding: '15px', textAlign: 'right' }}>
                                            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)' }}>
                                                <AlertCircle size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
                        <AnalyticsCard title="System Growth (New Users)" type="area" data={userAnalytics} />
                        <AnalyticsCard title="Global Attendance Rate" type="line" data={attendanceAnalytics} />
                    </div>
                )}

                {activeTab === 'audit' && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--accent-secondary)' }}>
                                    <th style={{ padding: '15px' }}>Action</th>
                                    <th style={{ padding: '15px' }}>Performed By</th>
                                    <th style={{ padding: '15px' }}>Target</th>
                                    <th style={{ padding: '15px' }}>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '15px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{log.action}</td>
                                        <td style={{ padding: '15px' }}>{log.performedBy?.name || 'Unknown'}</td>
                                        <td style={{ padding: '15px' }}>{log.target}</td>
                                        <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'institutions' && user?.role === 'super_admin' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        <div className="glass-panel card" style={{ padding: '20px' }}>
                            <h3>Create Institution</h3>
                            <form onSubmit={createInstitution} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                                <input className="input-glass" placeholder="Name" value={newInst.name} onChange={e => setNewInst({ ...newInst, name: e.target.value })} required />
                                <input className="input-glass" placeholder="Code (e.g. IITD)" value={newInst.code} onChange={e => setNewInst({ ...newInst, code: e.target.value })} required />
                                <input className="input-glass" placeholder="Address" value={newInst.address} onChange={e => setNewInst({ ...newInst, address: e.target.value })} />
                                <button className="btn-glow">Create</button>
                            </form>

                            <hr style={{ margin: '20px 0', borderColor: 'var(--glass-border)' }} />

                            <h4>Existing Institutions</h4>
                            <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                {institutions.map(inst => (
                                    <li key={inst._id} style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>
                                        <strong>{inst.name}</strong> ({inst.code})
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="glass-panel card" style={{ padding: '20px' }}>
                            <h3>Add College Admin</h3>
                            <form onSubmit={createCollegeAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                                <select className="input-glass" value={newAdmin.institutionId} onChange={e => setNewAdmin({ ...newAdmin, institutionId: e.target.value })} required>
                                    <option value="">Select Institution</option>
                                    {institutions.map(inst => (
                                        <option key={inst._id} value={inst._id}>{inst.name}</option>
                                    ))}
                                </select>
                                <input className="input-glass" placeholder="Admin Name" value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} required />
                                <input className="input-glass" type="email" placeholder="Email" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} required />
                                <input className="input-glass" type="password" placeholder="Password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} required />
                                <button className="btn-glow">Create Admin</button>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminPanel;
