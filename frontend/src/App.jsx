import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    LayoutDashboard, Archive, User, LogOut, Building2, Menu, X,
    Mail, FileSpreadsheet, Sun, Moon, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import ClosedDeals from './components/ClosedDeals';
import Profile from './components/Profile';
import Login from './components/Login';
import QuotesSection from './components/QuotesSection';
import EmailThreads from './components/EmailThreads';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

function Layout({ onLogout }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });
    const [darkMode, setDarkMode] = useState(() => {
        const stored = localStorage.getItem('theme');
        return stored ? stored === 'dark' : true; // default dark
    });
    const navigate = useNavigate();

    const user = (() => {
        try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
    })();

    // Apply theme to HTML element
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    // Persist sidebar collapsed state
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', sidebarCollapsed ? 'true' : 'false');
    }, [sidebarCollapsed]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        onLogout();
        navigate('/login');
    };

    const navItems = [
        { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { to: '/quotes', icon: <FileSpreadsheet size={18} />, label: 'Quotes Sheets' },
        { to: '/email-threads', icon: <Mail size={18} />, label: 'Email Threads' },
        { to: '/closed', icon: <Archive size={18} />, label: 'Closed Deals' },
        { to: '/profile', icon: <User size={18} />, label: 'Profile' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarOpen ? 'mobile-open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div style={{ background: 'var(--primary-bg)', padding: '0.5rem', borderRadius: '10px', flexShrink: 0 }}>
                        <Building2 size={22} color="var(--primary-accent)" />
                    </div>
                    <div className="sidebar-logo-text">
                        <div style={{ fontWeight: '700', fontSize: '0.95rem', letterSpacing: '-0.3px' }}>Enterprise Sync</div>
                        <div className="text-secondary" style={{ fontSize: '0.75rem' }}>CRM Dashboard</div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', display: 'none' }}
                        className="mobile-close-btn">
                        <X size={18} color="var(--text-secondary)" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            data-tooltip={item.label}
                        >
                            <span className="sidebar-link-icon">{item.icon}</span>
                            <span className="sidebar-link-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom: Theme + User + Logout */}
                <div className="sidebar-bottom">
                    {/* Theme Toggle */}
                    <button className="theme-toggle" onClick={() => setDarkMode(prev => !prev)}>
                        <span className="theme-icon">
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </span>
                        <span className="theme-toggle-label">
                            {darkMode ? 'Light Mode' : 'Dark Mode'}
                        </span>
                    </button>

                    {/* Collapse Toggle */}
                    <button
                        className="sidebar-collapse-btn"
                        onClick={() => setSidebarCollapsed(prev => !prev)}
                        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        style={{ width: '100%' }}
                    >
                        {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>

                    {/* User Card */}
                    <div className="sidebar-user-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="sidebar-user-avatar" style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: 'var(--primary-bg)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <User size={16} color="var(--primary-accent)" />
                            </div>
                            <div className="sidebar-user-info">
                                <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.15rem' }}>{user.name || user.email || 'User'}</div>
                                <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{user.role || 'Member'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Sign Out */}
                    <button className="sidebar-signout" onClick={handleLogout}>
                        <LogOut size={18} style={{ flexShrink: 0 }} />
                        <span className="sidebar-signout-label">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className={`main-content ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
                {/* Top bar (mobile only) */}
                <header className="mobile-header" style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid var(--border)',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--sidebar-bg)',
                    position: 'sticky', top: 0, zIndex: 30
                }}>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
                        <Menu size={22} color="var(--text-primary)" />
                    </button>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Enterprise Sync</span>
                    <div style={{ width: 28 }} />
                </header>

                <main style={{ flex: 1, padding: '2rem 2.5rem', overflowX: 'hidden' }}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/quotes" element={<QuotesSection />} />
                        <Route path="/email-threads" element={<EmailThreads />} />
                        <Route path="/closed" element={<ClosedDeals />} />
                        <Route path="/profile" element={<Profile />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

export default function App() {
    const [isAuth, setIsAuth] = useState(!!localStorage.getItem('token'));

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={isAuth ? <Navigate to="/" replace /> : <Login setAuth={setIsAuth} />} />
                <Route path="/*" element={isAuth ? <Layout onLogout={() => setIsAuth(false)} /> : <Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
