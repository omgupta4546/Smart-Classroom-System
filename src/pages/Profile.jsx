import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Hash, Camera, Save, AlertCircle } from 'lucide-react';

const Profile = () => {
    const { user, api, login } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        universityRollNo: '',
        classRollNo: '',
        profilePic: '',
        university: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/users/profile');
                setFormData({
                    name: res.data.name || '',
                    email: res.data.email || '',
                    universityRollNo: res.data.universityRollNo || '',
                    classRollNo: res.data.classRollNo || '',
                    profilePic: res.data.profilePic || '',
                    university: res.data.institutionId?.name || 'Default University'
                });
            } catch (err) {
                console.error('Error fetching profile:', err);
                setMessage({ type: 'error', text: 'Failed to load profile' });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [api]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, profilePic: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await api.put('/users/profile', formData);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            // Optionally update the context user if needed, but the context usually holds token info
            // If the context holds the full user, we might need a way to refresh it.
            // For now, assume we just update the local state.
        } catch (err) {
            console.error('Error updating profile:', err);
            setMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex-center" style={{ height: '80vh' }}><div className="loader"></div></div>;

    return (
        <div className="content-wrapper fade-in" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>
                    Student <span className="text-gradient">Profile</span>
                </h1>
                <p className="text-muted">Keep your academic information up to date.</p>
            </div>

            <div className="glass-panel" style={{ padding: '40px' }}>
                <form onSubmit={handleSubmit}>
                    {/* Profile Photo Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
                        <div style={{ position: 'relative', width: '150px', height: '150px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-primary)', marginBottom: '15px', background: 'rgba(255,255,255,0.05)' }} className="flex-center">
                            {formData.profilePic ? (
                                <img src={formData.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={80} style={{ opacity: 0.2 }} />
                            )}
                            <label htmlFor="profile-upload" style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '5px', fontSize: '0.7rem', textAlign: 'center', cursor: 'pointer' }}>
                                <Camera size={14} style={{ marginRight: '5px' }} /> CHANGE
                            </label>
                            <input id="profile-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>University / Institution</label>
                        <div style={{ position: 'relative' }}>
                            <AlertCircle size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                            <input
                                type="text" name="university" className="input-glass" value={formData.university}
                                style={{ paddingLeft: '45px', opacity: 0.7, cursor: 'not-allowed' }} readOnly
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                <input
                                    type="text" name="name" className="input-glass" value={formData.name} onChange={handleChange}
                                    style={{ paddingLeft: '45px' }} required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                <input
                                    type="email" name="email" className="input-glass" value={formData.email} onChange={handleChange}
                                    style={{ paddingLeft: '45px' }} required
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                        <div>
                            <label className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>University Roll No.</label>
                            <div style={{ position: 'relative' }}>
                                <Hash size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                <input
                                    type="text" name="universityRollNo" className="input-glass" value={formData.universityRollNo} onChange={handleChange}
                                    style={{ paddingLeft: '45px' }} placeholder="e.g. 2100101010"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>Class Roll No.</label>
                            <div style={{ position: 'relative' }}>
                                <Hash size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                <input
                                    type="text" name="classRollNo" className="input-glass" value={formData.classRollNo} onChange={handleChange}
                                    style={{ paddingLeft: '45px' }} placeholder="e.g. CS-01"
                                />
                            </div>
                        </div>
                    </div>

                    {message.text && (
                        <div style={{
                            padding: '15px',
                            borderRadius: '12px',
                            marginBottom: '20px',
                            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            border: `1px solid ${message.type === 'success' ? 'var(--status-success)' : 'var(--status-critical)'}`,
                            color: message.type === 'success' ? 'var(--status-success)' : 'var(--status-critical)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <AlertCircle size={18} />
                            {message.text}
                        </div>
                    )}

                    <button type="submit" className="btn-glow" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} disabled={saving}>
                        {saving ? <div className="loader" style={{ width: '20px', height: '20px', borderThickness: '2px' }}></div> : <Save size={18} />}
                        {saving ? 'Saving...' : 'Update Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
