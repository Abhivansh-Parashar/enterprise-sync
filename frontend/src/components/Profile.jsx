import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Shield } from 'lucide-react';

export default function Profile() {
    const [profile, setProfile] = useState({ name: '', email: '', role: '' });
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get('/api/profile');
                setProfile({ name: res.data.name, email: res.data.email, role: res.data.role });
            } catch (err) {
                setMessage({ type: 'error', text: 'Error fetching profile data.' });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const payload = { name: profile.name, email: profile.email };
            if (password) payload.password = password;

            const res = await axios.put('/api/profile', payload);

            // Update local storage user data seamlessly
            const currentUser = JSON.parse(localStorage.getItem('user'));
            localStorage.setItem('user', JSON.stringify({ ...currentUser, email: profile.email, name: profile.name }));

            setMessage({ type: 'success', text: res.data.message });
            setPassword(''); // Clear password field after save
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Profile...</div>;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', background: 'var(--primary-bg)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                        <User color="var(--primary-accent)" size={32} />
                    </div>
                    <h2 style={{ marginBottom: '0.25rem' }}>Personal Profile</h2>
                    <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Update your dashboard credentials and details</p>
                </div>

                {message.text && (
                    <div className={`badge-${message.type === 'success' ? 'success' : 'danger'}`} style={{ padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label className="text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            <User size={14} /> Full Name
                        </label>
                        <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            <Mail size={14} /> Email Address
                        </label>
                        <input
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            <Shield size={14} /> New Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Leave blank to keep current password"
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '0.75rem' }} disabled={saving}>
                        {saving ? 'Saving Changes...' : 'Save Profile Details'}
                    </button>
                </form>
            </div>
        </div>
    );
}
