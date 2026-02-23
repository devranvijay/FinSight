import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, BarChart2, TrendingUp,
    Receipt, Bot, Hexagon, LogOut, UserCog, Menu, X
} from 'lucide-react';

const NAV = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/analytics', icon: BarChart2, label: 'Analytics' },
    { to: '/forecast', icon: TrendingUp, label: 'Forecast & Risk' },
    { to: '/transactions', icon: Receipt, label: 'Transactions' },
    { to: '/assistant', icon: Bot, label: 'AI Assistant' },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem('finsight_user') || '{"email":"admin@finsight.ai","role":"admin"}');

    // Close sidebar on route change (mobile)
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('finsight_token');
        localStorage.removeItem('finsight_user');
        navigate('/login', { replace: true });
    };

    const sidebarContent = (
        <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
            <div className="sidebar-logo">
                <Hexagon size={22} strokeWidth={1.5} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                <div>
                    <h1>FinSight AI</h1>
                    <span>Financial Intelligence Engine</span>
                </div>
                {/* Close button — mobile only */}
                <button className="sidebar-close-btn" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                    <X size={18} />
                </button>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section-label">Navigation</div>
                {NAV.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                    >
                        <Icon size={16} strokeWidth={1.8} className="nav-icon" />
                        {label}
                    </NavLink>
                ))}

                {user.role === 'admin' && (
                    <>
                        <div className="nav-section-label" style={{ marginTop: 16 }}>Admin</div>
                        <NavLink
                            to="/users"
                            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                        >
                            <UserCog size={16} strokeWidth={1.8} className="nav-icon" />
                            User Management
                        </NavLink>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="user-avatar">{user.email?.[0]?.toUpperCase() ?? 'A'}</div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.email?.split('@')[0] ?? 'Admin'}
                        </div>
                        <div style={{ textTransform: 'capitalize', color: 'var(--accent-blue)', fontSize: 11 }}>{user.role}</div>
                    </div>
                    <LogOut size={14} style={{ color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0, cursor: 'pointer' }}
                        title="Sign out" onClick={handleLogout} />
                </div>
            </div>
        </aside>
    );

    return (
        <>
            {/* Hamburger toggle — mobile only */}
            <button
                className="hamburger-btn"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
            >
                <Menu size={20} />
            </button>

            {/* Overlay */}
            {mobileOpen && (
                <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
            )}

            {sidebarContent}
        </>
    );
}
