import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, Eye, EyeOff, UserPlus, LogIn, ArrowLeft } from 'lucide-react';
import AuthCanvas from '../components/AuthCanvas';

const API = 'http://localhost:8001';

// ── Login Form ────────────────────────────────────────────────────────────────
function LoginForm({ onSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const res = await fetch(`${API}/api/auth/login`, {
                method: 'POST',
                body: new URLSearchParams({ username: email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Login failed');
            localStorage.setItem('finsight_token', data.access_token);
            localStorage.setItem('finsight_user', JSON.stringify({ email, role: data.role }));
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="auth-field">
                <label>Email</label>
                <input type="email" required autoFocus placeholder="admin@finsight.ai"
                    value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="auth-field">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'} required placeholder="Enter your password"
                        value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="button" className="pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
                {loading ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Signing in…</> : <><LogIn size={14} /> Sign In</>}
            </button>

            <div className="auth-hint">
                <span>Quick fill:</span>
                <button type="button" className="auth-chip" onClick={() => { setEmail('admin@finsight.ai'); setPassword('Admin@123'); }}>Admin</button>
                <button type="button" className="auth-chip" onClick={() => { setEmail('analyst@finsight.ai'); setPassword('Analyst@123'); }}>Analyst</button>
                <button type="button" className="auth-chip" onClick={() => { setEmail('viewer@finsight.ai'); setPassword('Viewer@123'); }}>Viewer</button>
            </div>
        </form>
    );
}

// ── Register Form ─────────────────────────────────────────────────────────────
function RegisterForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [role, setRole] = useState('analyst');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPass, setAdminPass] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (password !== confirm) return setError('Passwords do not match.');
        if (password.length < 8) return setError('Password must be at least 8 characters.');
        setLoading(true);
        try {
            const loginRes = await fetch(`${API}/api/auth/login`, {
                method: 'POST',
                body: new URLSearchParams({ username: adminEmail, password: adminPass }),
            });
            const loginData = await loginRes.json();
            if (!loginRes.ok) throw new Error('Admin credentials invalid: ' + (loginData.detail || ''));

            const regRes = await fetch(`${API}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginData.access_token}` },
                body: JSON.stringify({ email, password, role }),
            });
            const regData = await regRes.json();
            if (!regRes.ok) throw new Error(regData.detail || 'Registration failed');
            setSuccess(`✅ User "${email}" created as ${role}! Go back to login.`);
            setEmail(''); setPassword(''); setConfirm('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12 }}>
                <div className="auth-field" style={{ flex: 1 }}>
                    <label>Admin Email</label>
                    <input type="email" required placeholder="admin@finsight.ai"
                        value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
                </div>
                <div className="auth-field" style={{ flex: 1 }}>
                    <label>Admin Password</label>
                    <input type="password" required placeholder="Admin password"
                        value={adminPass} onChange={e => setAdminPass(e.target.value)} />
                </div>
            </div>
            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
            <div className="auth-field">
                <label>New User Email</label>
                <input type="email" required placeholder="newuser@company.ai"
                    value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
                <div className="auth-field" style={{ flex: 1 }}>
                    <label>Password</label>
                    <div style={{ position: 'relative' }}>
                        <input type={showPw ? 'text' : 'password'} required placeholder="Min 8 chars"
                            value={password} onChange={e => setPassword(e.target.value)} />
                        <button type="button" className="pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                </div>
                <div className="auth-field" style={{ flex: 1 }}>
                    <label>Confirm Password</label>
                    <input type="password" required placeholder="Repeat password"
                        value={confirm} onChange={e => setConfirm(e.target.value)} />
                </div>
            </div>
            <div className="auth-field">
                <label>Role</label>
                <select value={role} onChange={e => setRole(e.target.value)}>
                    <option value="analyst">Analyst — Read &amp; write data</option>
                    <option value="viewer">Viewer — Read only</option>
                    <option value="admin">Admin — Full access</option>
                </select>
            </div>
            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Creating…</> : <><UserPlus size={14} /> Create Account</>}
            </button>
        </form>
    );
}

// ── Main Auth Page ────────────────────────────────────────────────────────────
export default function AuthPage() {
    const [tab, setTab] = useState('login');
    const navigate = useNavigate();

    const onLoginSuccess = () => navigate('/', { replace: true });

    return (
        <div className="auth-shell">
            {/* Three.js background canvas — full viewport, behind everything */}
            <AuthCanvas />

            {/* Glassmorphism content layer */}
            <div className="auth-content">
                {/* Left branding panel */}
                <div className="auth-left">
                    <div className="auth-brand">
                        <Hexagon size={52} strokeWidth={1} style={{ color: '#3b82f6' }} />
                        <h1>FinSight AI</h1>
                        <p>Intelligent Financial Decision Engine</p>
                    </div>
                    <div className="auth-features">
                        {[
                            'AI-powered cash flow forecasting',
                            'Real-time anomaly detection',
                            'Predictive risk scoring',
                            'Smart recommendations engine',
                        ].map(f => (
                            <div key={f} className="auth-feature-item">
                                <div className="auth-feature-dot" />
                                {f}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right form panel */}
                <div className="auth-right">
                    <div className="auth-card">
                        {tab !== 'login' && (
                            <button type="button" className="auth-back" onClick={() => setTab('login')}>
                                <ArrowLeft size={14} /> Back to Login
                            </button>
                        )}
                        <div className="auth-card-header">
                            <h2>{tab === 'login' ? 'Welcome back' : 'Create new user'}</h2>
                            <p>{tab === 'login' ? 'Sign in to your FinSight account' : 'Admin credentials required to create accounts'}</p>
                        </div>

                        {tab === 'login' ? <LoginForm onSuccess={onLoginSuccess} /> : <RegisterForm />}

                        {tab === 'login' && (
                            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
                                Admin?{' '}
                                <button type="button" onClick={() => setTab('register')}
                                    style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 600 }}>
                                    Create a new user account
                                </button>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
