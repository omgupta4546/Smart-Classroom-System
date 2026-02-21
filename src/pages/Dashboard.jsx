import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import AnalyticsCard from '../components/AnalyticsCard';
import OverallAttendanceBar from '../components/OverallAttendanceBar';
import {
    Users, Book, ShieldCheck, Plus, FolderOpen,
    Trash2, LogOut, TrendingUp
} from 'lucide-react';

/* ─── Helper: Stat Card ─── */
const StatCard = ({ icon, label, value, badge, badgeOk, accent }) => (
    <div style={{
        padding: '20px 22px',
        background: 'rgba(10,14,28,0.6)',
        border: `1px solid ${accent}22`,
        borderRadius: '18px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
        position: 'relative', overflow: 'hidden'
    }}>
        <div style={{
            position: 'absolute', top: 0, right: 0, width: '100px', height: '100px',
            background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
            borderRadius: '50%', transform: 'translate(30%, -30%)'
        }} />
        <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: `${accent}22`, border: `1px solid ${accent}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accent, marginBottom: '12px'
        }}>{icon}</div>
        <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>{label}</p>
        <p style={{ margin: '0 0 10px', fontSize: '2rem', fontWeight: '900', color: 'white', lineHeight: 1 }}>{value}</p>
        <span style={{
            fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '100px',
            background: badgeOk ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            color: badgeOk ? '#34d399' : '#f87171',
            border: `1px solid ${badgeOk ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`
        }}>{badge}</span>
    </div>
);

/* ─── Helper: Section Header ─── */
const SectionHeader = ({ icon, title, badge, noMargin }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: noMargin ? 0 : '18px' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', display: 'flex' }}>{icon}</div>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{title}</h3>
        {badge && (
            <span style={{
                fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '100px',
                background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)'
            }}>{badge}</span>
        )}
    </div>
);

/* ─── Main Dashboard Component ─── */
const Dashboard = () => {
    const { user, api } = useAuth();
    const [classes, setClasses] = useState([]);
    const [attendanceTrend, setAttendanceTrend] = useState([]);
    const [participationStats, setParticipationStats] = useState([]);
    const [radarData, setRadarData] = useState([]);
    const [faceDetectionData, setFaceDetectionData] = useState([]);
    const [insights, setInsights] = useState([]);
    const [stats, setStats] = useState({ primaryStat: '0', avgAttendance: '0', trend: '0', statusMessage: '' });
    const [loading, setLoading] = useState(true);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [classCode, setClassCode] = useState('');
    const [newClassName, setNewClassName] = useState('');
    const [newSubjectName, setNewSubjectName] = useState('');
    const [subjectNameEdited, setSubjectNameEdited] = useState(false);

    const fetchDashboardData = async () => {
        try {
            const calls = [
                api.get('/classes/my'),                        // 0
                api.get('/classes/analytics/attendance'),      // 1
                api.get('/classes/analytics/participation'),   // 2
                api.get('/classes/summary'),                   // 3
                api.get('/classes/analytics/insights'),        // 4
                api.get('/classes/analytics/radar'),           // 5
            ];
            if (user?.role === 'professor') {
                calls.push(api.get('/classes/analytics/face-detection')); // 6
            }

            // Use allSettled so one failure doesn't block the whole dashboard
            const results = await Promise.allSettled(calls);

            const ok = (r) => r.status === 'fulfilled' ? r.value.data : null;
            const warn = (r, label) => {
                if (r.status === 'rejected') console.warn(`[Dashboard] ${label} failed:`, r.reason?.message || r.reason);
            };

            warn(results[0], 'my-classes');
            warn(results[1], 'attendance-trend');
            warn(results[2], 'participation');
            warn(results[3], 'summary');
            warn(results[4], 'insights');
            warn(results[5], 'radar');

            if (ok(results[0])) setClasses(ok(results[0]));
            if (ok(results[1])) setAttendanceTrend(ok(results[1]));
            if (ok(results[2])) setParticipationStats(ok(results[2]));
            if (ok(results[3])) setStats(ok(results[3]));
            if (ok(results[4])) setInsights(ok(results[4]));
            if (ok(results[5])) setRadarData(ok(results[5]));
            if (user?.role === 'professor' && results[6]) {
                if (ok(results[6])) setFaceDetectionData(ok(results[6]));
                warn(results[6], 'face-detection');
            }
        } catch (err) {
            console.error('Fatal dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };


    const handleLeaveClass = async (classId, className) => {
        if (window.confirm(`Leave ${className}?`)) {
            try { await api.post(`/classes/${classId}/leave`); fetchDashboardData(); }
            catch { alert('Failed to leave class'); }
        }
    };

    const handleDeleteClass = async (classId, className) => {
        if (window.confirm(`Delete ${className}? All attendance data will be lost permanently.`)) {
            try { await api.delete(`/classes/${classId}`); fetchDashboardData(); }
            catch { alert('Failed to delete class'); }
        }
    };

    useEffect(() => {
        const authLoading = localStorage.getItem('token') && !user;
        if (!authLoading) fetchDashboardData();
    }, [api, user]);

    const handleJoinClass = async (e) => {
        e.preventDefault();
        try {
            await api.post('/classes/join', { code: classCode });
            setShowJoinModal(false); setClassCode('');
            fetchDashboardData();
        } catch (err) { alert(err.response?.data?.msg || 'Error joining class'); }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            await api.post('/classes/create', {
                name: newClassName,
                subjectName: newSubjectName || newClassName,
                code
            });
            setShowCreateModal(false);
            setNewClassName('');
            setNewSubjectName('');
            setSubjectNameEdited(false);
            fetchDashboardData();
        } catch (err) { alert(err.response?.data?.msg || 'Error creating class'); }
    };

    if (loading) return (
        <div className="flex-center" style={{ height: '80vh' }}>
            <div className="loader" />
        </div>
    );

    const insightColor = (type) => type === 'critical' ? '#f87171' : type === 'warning' ? '#fbbf24' : '#34d399';
    const insightBorderColor = (type) => type === 'critical' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981';

    return (
        <div className="content-wrapper fade-in" style={{ padding: '36px 24px 60px', maxWidth: '1280px', margin: '0 auto' }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
                <div style={{
                    width: '44px', height: '44px', borderRadius: '13px',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(99,102,241,0.4)', flexShrink: 0
                }}>
                    <TrendingUp size={20} color="white" />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: 0 }}>
                        Welcome, <span className="text-gradient">{user?.name}</span>
                    </h1>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                        {user?.institutionId?.name || 'Smart Classroom Platform'} · {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </p>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '30px' }}>
                <StatCard
                    icon={<TrendingUp size={18} />}
                    label={user?.role === 'professor' ? 'Total Students' : 'Overall Attendance'}
                    value={user?.role === 'student' ? `${stats.primaryStat}%` : stats.primaryStat}
                    badge={`${parseFloat(stats.trend) >= 0 ? '+' : ''}${stats.trend}% vs last week`}
                    badgeOk={parseFloat(stats.trend) >= 0}
                    accent="#6366f1"
                />
                <StatCard
                    icon={<Book size={18} />}
                    label="My Classes"
                    value={classes.length}
                    badge={`${classes.length} enrolled`}
                    badgeOk={true}
                    accent="#06b6d4"
                />
                {user?.role === 'professor' ? (
                    <StatCard
                        icon={<Users size={18} />}
                        label="Avg Class Attendance"
                        value={`${stats.avgAttendance || 0}%`}
                        badge={parseFloat(stats.avgAttendance) >= 75 ? 'Above threshold' : 'Below threshold'}
                        badgeOk={parseFloat(stats.avgAttendance) >= 75}
                        accent="#10b981"
                    />
                ) : (
                    <div style={{
                        padding: '20px 22px',
                        background: 'rgba(10,14,28,0.6)',
                        border: user?.isFaceRegistered ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '18px', backdropFilter: 'blur(20px)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.35)', position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, right: 0, width: '80px', height: '80px',
                            background: `radial-gradient(circle, ${user?.isFaceRegistered ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'} 0%, transparent 70%)`,
                            borderRadius: '50%', transform: 'translate(20%, -20%)'
                        }} />
                        <p style={{ margin: '0 0 10px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Face ID Status</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <div style={{
                                width: '10px', height: '10px', borderRadius: '50%',
                                background: user?.isFaceRegistered ? '#10b981' : '#ef4444',
                                boxShadow: `0 0 12px ${user?.isFaceRegistered ? '#10b981' : '#ef4444'}`
                            }} />
                            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{user?.isFaceRegistered ? 'Verified' : 'Not Registered'}</span>
                        </div>
                        {!user?.isFaceRegistered && (
                            <Link to="/face-register" className="btn-glow" style={{ display: 'block', textAlign: 'center', padding: '8px', fontSize: '0.8rem' }}>Setup Face ID →</Link>
                        )}
                    </div>
                )}
            </div>

            {/* ── Overall Attendance Bar (Student) ── */}
            {user?.role === 'student' && (
                <OverallAttendanceBar percentage={stats.primaryStat} message={stats.statusMessage} />
            )}

            {/* ── Analytics ── */}
            <SectionHeader icon={<TrendingUp size={16} />} title="Analytics" badge="Live Data" />

            {user?.role === 'student' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px', marginBottom: '36px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <AnalyticsCard
                            title="Subject-Wise Attendance"
                            subtitle="Classes attended vs total classes happened per subject"
                            type="horizontalBar"
                            data={participationStats}
                        />
                    </div>
                    <AnalyticsCard
                        title="Attendance Trend (14 days)"
                        subtitle="Your daily attendance rate vs university average"
                        type="composed"
                        data={attendanceTrend}
                    />
                    {radarData?.length > 0 && (
                        <AnalyticsCard
                            title="Performance Radar"
                            subtitle="Attendance spread across all subjects"
                            type="radar"
                            data={radarData}
                        />
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px', marginBottom: '36px' }}>
                    <AnalyticsCard
                        title="Class Attendance Trend"
                        subtitle="Average attendance rate across all your classes (14 days)"
                        type="composed"
                        data={attendanceTrend}
                    />
                    <AnalyticsCard
                        title="Face Detection Quality"
                        subtitle="Breakdown of face recognition outcomes in sessions"
                        type="faceDetection"
                        data={faceDetectionData}
                    />
                    {radarData?.length > 0 && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <AnalyticsCard
                                title="Participation by Subject"
                                subtitle="Attendance distribution across all classes"
                                type="radar"
                                data={radarData}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* ── Smart Insights ── */}
            {insights?.length > 0 && (
                <div style={{ marginBottom: '36px' }}>
                    <SectionHeader icon={<ShieldCheck size={16} />} title="Smart Insights" badge={`${insights.length} alerts`} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
                        {insights.map((insight, idx) => (
                            <div key={idx} style={{
                                padding: '18px 20px',
                                background: 'rgba(10,14,28,0.55)',
                                borderRadius: '16px', backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderLeft: `3px solid ${insightBorderColor(insight.type)}`,
                            }}>
                                <h4 style={{ margin: '0 0 4px', fontSize: '0.88rem', color: insightColor(insight.type) }}>
                                    {insight.title}
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)' }}>{insight.message}</p>
                                {insight.data && (
                                    <div style={{ marginTop: '12px' }}>
                                        {insight.data.map((item, id) => (
                                            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{item.name}</span>
                                                <span style={{ color: 'rgba(255,255,255,0.35)' }}>{item.universityRollNo}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── My Classes ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <SectionHeader icon={<Book size={16} />} title="My Classes" badge={`${classes.length} total`} noMargin />
                {user?.role === 'professor' ? (
                    <button className="btn-glow" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={16} /> Create Class
                    </button>
                ) : (
                    <button className="btn-glow" onClick={() => setShowJoinModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={16} /> Join Class
                    </button>
                )}
            </div>

            {classes.length === 0 ? (
                <div className="glass-panel flex-center" style={{ padding: '60px', flexDirection: 'column', gap: '16px', background: 'rgba(10,14,28,0.4)' }}>
                    <FolderOpen size={44} style={{ opacity: 0.2 }} />
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)' }}>No classes yet. Get started!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {classes.map((cls) => (
                        <Link to={`/classroom/${cls.code}`} key={cls._id} style={{
                            display: 'block', textDecoration: 'none', color: 'inherit',
                            background: 'rgba(10,14,28,0.6)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '20px', overflow: 'hidden',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.25)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'; }}
                        >
                            <div style={{
                                height: '88px', position: 'relative',
                                background: `linear-gradient(135deg, hsl(${(cls.code?.charCodeAt(0) * 7) % 360}, 55%, 28%), hsl(${(cls.code?.charCodeAt(0) * 13) % 360}, 65%, 18%))`,
                            }}>
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(10,14,28,0.92) 100%)' }} />
                                <span style={{
                                    position: 'absolute', bottom: '10px', right: '14px',
                                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                                    padding: '3px 10px', borderRadius: '100px',
                                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: 'white'
                                }}>#{cls.code}</span>
                            </div>
                            <div style={{ padding: '14px 18px 18px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ margin: '0 0 3px', fontSize: '1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cls.name}</h3>
                                        <p style={{ margin: 0, fontSize: '0.73rem', color: 'rgba(255,255,255,0.4)' }}>Prof. {cls.professorName || 'Dr. Sharma'}</p>
                                    </div>
                                    {user?.role === 'professor' ? (
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteClass(cls._id, cls.name); }}
                                            style={{ padding: '7px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', flexShrink: 0 }}
                                        ><Trash2 size={14} /></button>
                                    ) : (
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLeaveClass(cls._id, cls.name); }}
                                            style={{ padding: '7px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', flexShrink: 0 }}
                                        ><LogOut size={14} /></button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Users size={12} color="rgba(99,102,241,0.7)" />
                                        <span style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)' }}>{cls.students?.length || 0} students</span>
                                    </div>
                                    <span style={{
                                        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
                                        padding: '4px 12px', borderRadius: '100px',
                                        background: 'rgba(99,102,241,0.14)', color: '#818cf8',
                                        border: '1px solid rgba(99,102,241,0.22)'
                                    }}>ENTER →</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* ── Join Modal ── */}
            {showJoinModal && (
                <div className="flex-center" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 2000, backdropFilter: 'blur(6px)' }}>
                    <div className="glass-panel" style={{ padding: '36px', maxWidth: '380px', width: '92%', borderRadius: '24px' }}>
                        <h2 style={{ marginTop: 0 }}>Join a Class</h2>
                        <p className="text-muted" style={{ marginBottom: '20px', fontSize: '0.88rem' }}>Enter the 6-character class code from your professor.</p>
                        <form onSubmit={handleJoinClass}>
                            <input type="text" className="input-glass" placeholder="e.g. AB12CD"
                                value={classCode} onChange={(e) => setClassCode(e.target.value)}
                                required maxLength="6" style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '1.5rem', marginBottom: '18px' }} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" className="btn-glow btn-outline" onClick={() => setShowJoinModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn-glow" style={{ flex: 1 }}>Join →</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Create Modal ── */}
            {showCreateModal && (
                <div className="flex-center" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 2000, backdropFilter: 'blur(6px)' }}>
                    <div className="glass-panel" style={{ padding: '36px', maxWidth: '380px', width: '92%', borderRadius: '24px' }}>
                        <h2 style={{ marginTop: 0 }}>Create Class</h2>
                        <p className="text-muted" style={{ marginBottom: '20px', fontSize: '0.88rem' }}>Give your new classroom a name. A unique code will be auto-generated.</p>
                        <form onSubmit={handleCreateClass}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px' }}>Class / Course Code</label>
                            <input type="text" className="input-glass" placeholder="e.g. CS301 - Data Structures"
                                value={newClassName}
                                onChange={(e) => {
                                    setNewClassName(e.target.value);
                                    if (!subjectNameEdited) setNewSubjectName(e.target.value);
                                }}
                                required style={{ marginBottom: '14px' }} />
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px' }}>Subject Name <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 500, textTransform: 'none' }}>(shown in charts)</span></label>
                            <input type="text" className="input-glass" placeholder="e.g. Data Structures"
                                value={newSubjectName}
                                onChange={(e) => { setSubjectNameEdited(true); setNewSubjectName(e.target.value); }}
                                style={{ marginBottom: '18px' }} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" className="btn-glow btn-outline" onClick={() => { setShowCreateModal(false); setNewClassName(''); setNewSubjectName(''); setSubjectNameEdited(false); }} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn-glow" style={{ flex: 1 }}>Create →</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default Dashboard;
