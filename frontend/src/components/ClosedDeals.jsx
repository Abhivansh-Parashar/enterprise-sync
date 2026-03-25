import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Archive, Trash2 } from 'lucide-react';

export default function ClosedDeals() {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClosedDeals = async () => {
            try {
                const res = await axios.get('/deals/closed');
                setDeals(res.data);
            } catch (error) {
                console.error('Error fetching closed deals:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClosedDeals();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to permanently delete this archived deal? This action cannot be undone.")) {
            try {
                await axios.delete(`/deals/${id}`);
                setDeals(deals.filter(deal => deal.id !== id));
            } catch (error) {
                console.error('Error deleting deal:', error);
                alert('Failed to delete deal.');
            }
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading closed deals...</div>;

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'var(--primary-bg)', padding: '0.75rem', borderRadius: '12px' }}>
                    <Archive color="var(--primary-accent)" size={28} />
                </div>
                <div>
                    <h2 style={{ margin: 0 }}>Closed Deals Archive</h2>
                    <p className="text-secondary" style={{ margin: 0 }}>Historical record of all closed enterprise deals</p>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '0' }}>
                {deals.length === 0 ? (
                    <p className="text-secondary" style={{ padding: '2rem', textAlign: 'center' }}>No closed deals yet.</p>
                ) : (
                    <div className="table-container">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                                    <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid var(--border)' }}>Client / Company</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid var(--border)' }}>Stage</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid var(--border)' }}>Last Update</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid var(--surface-border)' }}>Remark</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid var(--surface-border)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deals.map((deal) => (
                                    <tr key={deal.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <strong>{deal.clientName}</strong>
                                            <div className="text-secondary" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{deal.accountOwner}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className="badge badge-info">{deal.stage}</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {deal.lastUpdate ? format(new Date(deal.lastUpdate), 'MMM d, yyyy') : '-'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {deal.assignedTo || '-'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                className="btn-danger"
                                                onClick={() => handleDelete(deal.id)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem' }}
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
