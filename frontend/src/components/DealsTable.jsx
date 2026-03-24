import { format } from 'date-fns';
import { Edit2, Trash2, Archive } from 'lucide-react';

export default function DealsTable({ deals, onEdit, onDelete, onCloseDeal }) {
    if (!deals || deals.length === 0) {
        return <p className="text-secondary" style={{ padding: '1rem 0' }}>No active deals found.</p>;
    }

    const getStageBadgeColor = (stage) => {
        const s = (stage || '').toLowerCase();
        if (s.includes('close') || s.includes('win')) return 'badge-success';
        if (s.includes('discovery') || s.includes('qualif')) return 'badge-info';
        if (s.includes('negotiation') || s.includes('proposal')) return 'badge-warning';
        return 'badge-secondary';
    };

    return (
        <div style={{ overflowX: 'auto' }}>
            <table>
                <thead>
                    <tr>
                        <th>Client</th>
                        <th>Account Owner</th>
                        <th>Stage</th>
                        <th>Last Update</th>
                        <th>Assigned To</th>
                        <th>Follow-up</th>
                        <th>Blocker</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {deals.map(deal => (
                        <tr key={deal.id}>
                            <td style={{ fontWeight: '500' }}>{deal.clientName}</td>
                            <td>{deal.accountOwner}</td>
                            <td>
                                <span className={`badge ${getStageBadgeColor(deal.stage)}`}>
                                    {deal.stage}
                                </span>
                            </td>
                            <td className="text-secondary" style={{ fontSize: '0.875rem' }}>
                                {deal.lastUpdate ? format(new Date(deal.lastUpdate), 'MMM dd, yyyy') : '-'}
                            </td>
                            <td>
                                {deal.assignedTo && (
                                    <span className="badge badge-secondary" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)' }}>
                                        {deal.assignedTo}
                                    </span>
                                )}
                            </td>
                            <td className={deal.followUpDate && new Date(deal.followUpDate) <= new Date() ? 'text-danger' : ''}>
                                {deal.followUpDate ? format(new Date(deal.followUpDate), 'MMM dd, yyyy') : '-'}
                            </td>
                            <td>
                                {deal.blocker ? (
                                    <span className="badge badge-danger" title={deal.blocker}>Yes</span>
                                ) : '-'}
                            </td>
                            <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn-secondary"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem' }}
                                        onClick={() => onEdit(deal)}
                                    >
                                        <Edit2 size={14} /> Update
                                    </button>
                                    <button
                                        className="btn-danger"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--border)' }}
                                        onClick={() => onCloseDeal(deal.id)}
                                        title="Mark as closed"
                                    >
                                        <Archive size={14} /> Close
                                    </button>
                                    <button
                                        className="btn-danger"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem' }}
                                        onClick={() => onDelete(deal.id)}
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div >
    );
}
