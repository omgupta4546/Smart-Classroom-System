import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Download,
    MessageSquare,
    Users as UsersIcon,
    History,
    Camera,
    ChevronRight,
    MoreVertical,
    User as UserIcon,
    Presentation
} from 'lucide-react';

const Classroom = () => {
    const { classCode } = useParams();
    const { user, api } = useAuth();
    const [activeTab, setActiveTab] = useState('stream');
    const [classData, setClassData] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadClassDetails = async () => {
            try {
                // Get Class Info
                const classesRes = await api.get('/classes/my');
                const currentClass = classesRes.data.find(c => c.code === classCode);
                setClassData(currentClass);

                // Get Students
                const studentsRes = await api.get(`/classes/${classCode}/students`);
                setStudents(studentsRes.data);

                // Get Attendance History
                const historyRes = await api.get(`/classes/${classCode}/attendance`);
                setAttendanceHistory(historyRes.data);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadClassDetails();
    }, [classCode, api]);

    const exportToCSV = () => {
        if (attendanceHistory.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Date,Session ID,Total Present,Students\n";

        attendanceHistory.forEach(record => {
            const date = new Date(record.date).toLocaleDateString();
            const id = record._id.substring(record._id.length - 6).toUpperCase();
            const count = record.records.length;
            const studentNames = record.records.map(r => r.student?.name).join("; ");
            csvContent += `${date},${id},${count},"${studentNames}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Attendance_${classCode}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="flex-center" style={{ height: '80vh' }}><div className="loader"></div></div>;

    return (
        <div className="content-wrapper fade-in" style={{ padding: '0', maxWidth: '100%', margin: '0' }}>

            {/* Class Banner */}
            <div style={{
                background: 'linear-gradient(135deg, var(--bg-gradient-mid), var(--bg-gradient-start))',
                padding: '80px 5% 40px',
                borderBottom: '1px solid var(--glass-border)',
                borderRadius: '0 0 40px 40px'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div className="chip warning" style={{ marginBottom: '10px' }}>#{classData?.code}</div>
                        <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: '800' }}>{classData?.name}</h1>
                        <p className="text-muted" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Presentation size={20} />
                            Prof. {classData?.professorName || 'Dr. Pankaj Sharma'}
                        </p>
                    </div>
                    {user?.role === 'professor' && (
                        <Link to={`/classroom/${classCode}/attendance`} className="btn-glow" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Camera size={18} /> TAKE ATTENDANCE
                        </Link>
                    )}
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>

                {/* Tabs Multi-Select */}
                <div className="glass-panel" style={{
                    display: 'flex',
                    gap: '5px',
                    padding: '5px',
                    borderRadius: '15px',
                    marginBottom: '30px',
                    width: 'fit-content'
                }}>
                    {[
                        { id: 'stream', icon: MessageSquare },
                        { id: 'people', icon: UsersIcon },
                        { id: 'attendance', icon: History }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: 'none',
                                background: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: '0.3s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                textTransform: 'capitalize'
                            }}
                        >
                            <tab.icon size={16} />
                            {tab.id}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="fade-in">

                    {activeTab === 'stream' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 3fr', gap: '30px' }}>
                            {/* Left: Class Info Sidebar */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="glass-panel card">
                                    <h4 style={{ marginBottom: '15px' }}>Upcoming</h4>
                                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>No work due soon!</p>
                                    <Link to="#" style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', marginTop: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        View all <ChevronRight size={14} />
                                    </Link>
                                </div>
                            </div>

                            {/* Right: Announcements */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <UserIcon size={20} color="white" />
                                    </div>
                                    <input type="text" className="input-glass" placeholder="Announce something to your class..." />
                                </div>

                                <div className="glass-panel card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'var(--accent-secondary)' }}></div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Dr. Pankaj Sharma</div>
                                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>Oct 12, 2025</div>
                                            </div>
                                        </div>
                                        <MoreVertical size={16} className="text-muted" style={{ cursor: 'pointer' }} />
                                    </div>
                                    <p>Welcome to the {classData?.name} class! We will be using this platform for AI-based attendance throughout the semester.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'people' && (
                        <div className="glass-panel" style={{ padding: '30px' }}>
                            <div style={{ borderBottom: '1px solid var(--accent-primary)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                                <h2 style={{ color: 'var(--accent-primary)' }}>Professors</h2>
                                <span>1 Total</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
                                <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                                <span>{classData?.professorName || 'Dr. Pankaj Sharma'}</span>
                            </div>

                            <div style={{ borderBottom: '1px solid var(--accent-primary)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                                <h2 style={{ color: 'var(--accent-primary)' }}>Students</h2>
                                <span>{students.length} Total</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {students.map(s => (
                                    <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid var(--glass-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
                                            <span>{s.name}</span>
                                        </div>
                                        <div className={`chip ${s.isFaceRegistered ? 'success' : 'critical'}`}>
                                            {s.isFaceRegistered ? 'Face Registered' : 'Not Registered'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div className="glass-panel" style={{ padding: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <h2>Attendance Logs</h2>
                                {user?.role === 'professor' && attendanceHistory.length > 0 && (
                                    <button onClick={exportToCSV} className="btn-glow btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                                        <Download size={14} /> EXPORT CSV
                                    </button>
                                )}
                            </div>

                            {attendanceHistory.length === 0 ? (
                                <p className="text-muted">No attendance sessions recorded yet.</p>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--accent-primary)' }}>
                                                <th style={{ padding: '15px' }}>Date</th>
                                                <th style={{ padding: '15px' }}>Session ID</th>
                                                <th style={{ padding: '15px' }}>Present Count</th>
                                                <th style={{ padding: '15px' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendanceHistory.map(record => (
                                                <tr key={record._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                    <td style={{ padding: '15px' }}>{new Date(record.date).toLocaleDateString()}</td>
                                                    <td style={{ padding: '15px' }}>{record._id.substring(record._id.length - 6).toUpperCase()}</td>
                                                    <td style={{ padding: '15px' }}>
                                                        <div className="chip success">{record.records.length} Present</div>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        <button className="btn-glow" style={{ padding: '5px 15px', fontSize: '0.7rem' }}>DETAILS</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Classroom;
