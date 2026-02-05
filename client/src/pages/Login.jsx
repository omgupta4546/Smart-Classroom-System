import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student', key: '' });
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            if (isLogin) {
                await login(formData.email, formData.password);
            } else {
                await register(formData);
            }
            navigate('/dashboard');
        } catch (err) {
            alert('Error: ' + (err.response?.data?.msg || 'Something went wrong'));
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh' }}>
            <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
                <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '20px' }}>
                    {isLogin ? 'Welcome Back' : 'Join Us'}
                </h2>

                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {!isLogin && (
                        <input type="text" name="name" placeholder="Full Name" className="input-glass" onChange={onChange} required />
                    )}

                    <input type="email" name="email" placeholder="Email Address" className="input-glass" onChange={onChange} required />
                    <input type="password" name="password" placeholder="Password" className="input-glass" onChange={onChange} required />

                    {!isLogin && (
                        <select name="role" className="input-glass" onChange={onChange} value={formData.role}>
                            <option value="student" style={{ color: 'black' }}>Student</option>
                            <option value="professor" style={{ color: 'black' }}>Professor</option>
                        </select>
                    )}

                    {!isLogin && formData.role === 'professor' && (
                        <input type="password" name="key" placeholder="Professor Key (admin123)" className="input-glass" onChange={onChange} />
                    )}

                    <button type="submit" className="btn-glow">{isLogin ? 'Login' : 'Register'}</button>
                </form>

                <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? 'Sign Up' : 'Login'}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Login;
