import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import {
    Users, UserCheck, UserX, Shield, Eye, Search,
    UserPlus, Trash2, RefreshCw, KeyRound, ChevronDown, Check, X
} from 'lucide-react';

const ROLE_COLORS = {
    admin: { bg: 'rgba(239,68,68,0.12)', text: '#f87171', border: 'rgba(239,68,68,0.25)' },
    analyst: { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
    viewer: { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.25)' },
};

const ROLE_ICONS = { admin: Shield, analyst: Users, viewer: Eye };

// ── Role Badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
    const c = ROLE_COLORS[role] || ROLE_COLORS.viewer;
    const Icon = ROLE_ICONS[role] || Eye;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
            background: c.bg, color: c.text, border: `1px solid ${c.border}`,
        }}>
            <Icon size={10} /> {role}
        </span>
    );
}

// ── Inline Role Dropdown ──────────────────────────────────────────────────────
function RoleDropdown({ userId, currentRole, onUpdate }) {
    const [open, setOpen] = useState(false);
    const roles = ['admin', 'analyst', 'viewer'];

    const select = async (role) => {
        setOpen(false);
        if (role === currentRole) return;
        await onUpdate(userId, { role });
    };

    return (
        <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button onClick={() => setOpen(v => !v)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                padding: '2px 8px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11,
            }}>
                <RoleBadge role={currentRole} /><ChevronDown size={10} />
            </button>
            {open && (
                <div style={{
                    position: 'absolute', top: '110%', left: 0, zIndex: 50,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 8, overflow: 'hidden', minWidth: 120,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}>
                    {roles.map(r => (
                        <button key={r} onClick={() => select(r)} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            width: '100%', padding: '8px 12px', background: 'none', border: 'none',
                            cursor: 'pointer', color: r === currentRole ? 'var(--accent-blue)' : 'var(--text-secondary)',
                            fontSize: 12,
                        }}>
                            {r} {r === currentRole && <Check size={11} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Reset Password Modal ──────────────────────────────────────────────────────
function ResetModal({ user, onClose, onDone }) {
    const [pw, setPw] = useState('');
    const [err, setErr] = useState('');
    const [ok, setOk] = useState(false);
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (pw.length < 8) return setErr('Min 8 characters');
        setBusy(true); setErr('');
        try {
            await api.post(`/api/users/${user.id}/reset-password`, { new_password: pw });
            setOk(true);
            setTimeout(() => { onDone(); onClose(); }, 1200);
        } catch (e) {
            setErr(e.response?.data?.detail || 'Reset failed');
        } finally { setBusy(false); }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 28, width: 340, boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}>
                <h3 style={{ marginBottom: 6, fontSize: 15 }}>Reset Password</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>{user.email}</p>
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="auth-field">
                        <label>New Password</label>
                        <input type="password" autoFocus placeholder="Min 8 characters"
                            value={pw} onChange={e => setPw(e.target.value)} />
                    </div>
                    {err && <div className="auth-error">{err}</div>}
                    {ok && <div className="auth-success">✅ Password reset!</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={onClose} style={{
                            flex: 1, padding: '9px 0', background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)',
                            cursor: 'pointer', fontSize: 13,
                        }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={busy} style={{ flex: 2 }}>
                            {busy ? 'Resetting…' : <><KeyRound size={13} /> Reset</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Users Page ────────────────────────────────────────────────────────────
export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [resetUser, setResetUser] = useState(null);

    const me = JSON.parse(localStorage.getItem('finsight_user') || '{}');

    const fetchUsers = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await api.get('/api/users');
            setUsers(res.data.data);
        } catch (e) {
            setError(e.response?.data?.detail || 'Failed to load users');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const updateUser = async (id, patch) => {
        try {
            const res = await api.patch(`/api/users/${id}`, patch);
            setUsers(prev => prev.map(u => u.id === id ? { ...u, ...res.data.user } : u));
        } catch (e) {
            setError(e.response?.data?.detail || 'Update failed');
        }
    };

    const deleteUser = async (user) => {
        if (!window.confirm(`Delete user "${user.email}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/api/users/${user.id}`);
            setUsers(prev => prev.filter(u => u.id !== user.id));
        } catch (e) {
            setError(e.response?.data?.detail || 'Delete failed');
        }
    };

    const filtered = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: users.length,
        active: users.filter(u => u.is_active).length,
        admins: users.filter(u => u.role === 'admin').length,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ── KPI strip ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {[
                    { label: 'Total Users', value: stats.total, icon: Users, color: 'var(--accent-blue)' },
                    { label: 'Active', value: stats.active, icon: UserCheck, color: 'var(--accent-green)' },
                    { label: 'Admins', value: stats.admins, icon: Shield, color: '#f87171' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: `${color}18`, border: `1px solid ${color}30`, flexShrink: 0,
                        }}>
                            <Icon size={18} style={{ color }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Table card ── */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Toolbar */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderBottom: '1px solid var(--border)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>
                        <Users size={16} style={{ color: 'var(--accent-blue)' }} /> User Management
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                placeholder="Search email or role…"
                                value={search} onChange={e => setSearch(e.target.value)}
                                style={{
                                    paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                    borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, outline: 'none', width: 200,
                                }}
                            />
                        </div>
                        <button onClick={fetchUsers} className="btn" style={{ padding: '7px 12px', gap: 6, fontSize: 12 }}>
                            <RefreshCw size={12} /> Refresh
                        </button>
                    </div>
                </div>

                {error && <div className="auth-error" style={{ margin: '12px 20px' }}>{error}</div>}

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-elevated)' }}>
                                {['User', 'Role', 'Status', 'Created', 'Actions'].map(h => (
                                    <th key={h} style={{
                                        padding: '10px 16px', textAlign: 'left', fontSize: 11,
                                        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px',
                                        color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                    <div className="spinner" style={{ margin: '0 auto 8px' }} /> Loading users…
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                    No users found
                                </td></tr>
                            ) : filtered.map((user, i) => {
                                const isSelf = user.email === me.email;
                                return (
                                    <tr key={user.id} style={{
                                        borderBottom: '1px solid var(--border)',
                                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
                                        opacity: user.is_active ? 1 : 0.5,
                                    }}>
                                        {/* User */}
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                                    background: 'var(--accent-blue)', display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff',
                                                }}>
                                                    {user.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        {user.email.split('@')[0]}
                                                        {isSelf && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--accent-blue)', fontWeight: 500 }}>(you)</span>}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Role */}
                                        <td style={{ padding: '12px 16px' }}>
                                            {isSelf
                                                ? <RoleBadge role={user.role} />
                                                : <RoleDropdown userId={user.id} currentRole={user.role} onUpdate={updateUser} />
                                            }
                                        </td>
                                        {/* Status */}
                                        <td style={{ padding: '12px 16px' }}>
                                            <button
                                                disabled={isSelf}
                                                onClick={() => updateUser(user.id, { is_active: !user.is_active })}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                                    padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: isSelf ? 'default' : 'pointer',
                                                    border: '1px solid', transition: 'all 0.15s',
                                                    background: user.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                                                    color: user.is_active ? '#34d399' : 'var(--text-muted)',
                                                    borderColor: user.is_active ? 'rgba(16,185,129,0.3)' : 'var(--border)',
                                                }}
                                            >
                                                {user.is_active ? <><UserCheck size={10} /> Active</> : <><UserX size={10} /> Inactive</>}
                                            </button>
                                        </td>
                                        {/* Created */}
                                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                        </td>
                                        {/* Actions */}
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    title="Reset Password"
                                                    onClick={() => setResetUser(user)}
                                                    style={{
                                                        padding: '5px 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                                        borderRadius: 6, cursor: 'pointer', color: 'var(--text-muted)',
                                                        display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, transition: 'all 0.15s',
                                                    }}
                                                >
                                                    <KeyRound size={12} /> Reset PW
                                                </button>
                                                {!isSelf && (
                                                    <button
                                                        title="Delete User"
                                                        onClick={() => deleteUser(user)}
                                                        style={{
                                                            padding: '5px 8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                                            borderRadius: 6, cursor: 'pointer', color: '#f87171',
                                                            display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, transition: 'all 0.15s',
                                                        }}
                                                    >
                                                        <Trash2 size={12} /> Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
                    Showing {filtered.length} of {users.length} users
                </div>
            </div>

            {/* Reset Password Modal */}
            {resetUser && (
                <ResetModal user={resetUser} onClose={() => setResetUser(null)} onDone={fetchUsers} />
            )}
        </div>
    );
}
