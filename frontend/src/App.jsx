import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, Archive, User, LogOut, Building2, Menu, X } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ClosedDeals from './components/ClosedDeals';
import Profile from './components/Profile';
import Login from './components/Login';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

function Layout({ onLogout }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const user = (() => {
        try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
    })();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        onLogout();
        navigate('/login');
    };

    const navItems = [
        { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
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
            <aside style={{
                width: '240px',
                background: 'var(--sidebar-bg)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: 0, bottom: 0, left: 0,
                zIndex: 50,
                transform: sidebarOpen ? 'translateX(0)' : undefined,
                transition: 'transform 0.2s ease',
            }}>
                {/* Logo */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--primary-bg)', padding: '0.5rem', borderRadius: '10px' }}>
                        <Building2 size={22} color="var(--primary-accent)" />
                    </div>
                    <div>
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
                <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            onClick={() => setSidebarOpen(false)}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.65rem 0.9rem',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                fontWeight: isActive ? '600' : '400',
                                background: isActive ? 'var(--primary-bg)' : 'transparent',
                                color: isActive ? 'var(--primary-accent)' : 'var(--text-secondary)',
                                transition: 'all 0.15s ease',
                            })}
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* User & Logout */}
                <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ padding: '0.75rem 0.9rem', marginBottom: '0.5rem', background: 'var(--surface)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.15rem' }}>{user.name || user.email || 'User'}</div>
                        <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{user.role || 'Member'}</div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.65rem 0.9rem', borderRadius: '8px', border: 'none',
                            background: 'transparent', cursor: 'pointer', fontSize: '0.9rem',
                            color: 'var(--danger)', fontWeight: '500'
                        }}>
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Top bar (mobile) */}
                <header style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
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
