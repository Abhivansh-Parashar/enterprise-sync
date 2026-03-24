import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { X } from 'lucide-react';

export default function DealForm({ deal, onClose, apiBase }) {
    const [formData, setFormData] = useState({
        clientName: '',
        accountOwner: '',
        stage: 'Going Well',
        assignedTo: '',
        blocker: '',
        followUpDate: '',
        notes: '',
        phoneNumber: '',
        priority: 'Medium'
    });
    const [saving, setSaving] = useState(false);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get(`${apiBase}/users`);
                setUsers(res.data);
            } catch (err) {
                console.error("Failed to load users for assignment", err);
            }
        };
        fetchUsers();
    }, [apiBase]);

    useEffect(() => {
        if (deal) {
            setFormData({
                clientName: deal.clientName || '',
                accountOwner: deal.accountOwner || '',
                stage: deal.stage || 'Going Well',
                assignedTo: deal.assignedTo || '',
                blocker: deal.blocker || '',
                followUpDate: deal.followUpDate || '',
                notes: deal.notes || '',
                phoneNumber: deal.phoneNumber || '',
                priority: deal.priority || 'Medium'
            });
        }
    }, [deal]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (deal) {
                await axios.put(`${apiBase}/deals/${deal.id}`, formData);
            } else {
                await axios.post(`${apiBase}/deals`, formData);
            }
            onClose();
        } catch (error) {
            console.error('Error saving deal:', error);
            alert('Failed to save deal. Check console.');
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="modal-overlay">
            <div className="modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>{deal ? 'Update Deal' : 'New Enterprise Deal'}</h2>
                    <button onClick={onClose} style={{ padding: '0.5rem' }}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Client Name *</label>
                            <input name="clientName" value={formData.clientName} onChange={handleChange} required disabled={!!deal} placeholder="e.g. Acme Corp" />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Phone Number</label>
                            <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+1 ..." />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Priority</label>
                            <select name="priority" value={formData.priority} onChange={handleChange}>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Stage</label>
                            <select name="stage" value={formData.stage} onChange={handleChange}>
                                <option value="Discovery">Discovery</option>
                                <option value="Going Well">Going Well</option>
                                <option value="Qualified">Qualified</option>
                                <option value="Proposal">Proposal</option>
                                <option value="Negotiation">Negotiation</option>
                                <option value="Closing">Closing</option>
                                <option value="Closed Won">Closed Won</option>
                                <option value="Closed Lost">Closed Lost</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Follow-up Date</label>
                            <input type="date" name="followUpDate" value={formData.followUpDate} onChange={handleChange} />
                        </div>
                    </div>

                    <div>
                        <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Assigned To</label>
                        <select name="assignedTo" value={formData.assignedTo} onChange={handleChange}>
                            <option value="">- Select -</option>
                            {users.map(u => (
                                <option key={u.id} value={u.name}>{u.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Blocker (if any)</label>
                        <input name="blocker" value={formData.blocker} onChange={handleChange} placeholder="Describe any roadblocks..." />
                        {formData.blocker && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>This deal will be marked as blocked!</span>}
                    </div>

                    <div>
                        <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Notes / Context</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder="Latest updates or manager input..." />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Save & Update Pipeline'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
