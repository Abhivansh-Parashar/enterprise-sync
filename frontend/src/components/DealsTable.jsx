import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Archive, Mail, FileSpreadsheet } from 'lucide-react';

export default function DealsTable({ deals, onEdit, onDelete, onCloseDeal }) {
    const navigate = useNavigate();

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

    const handleAddThread = (clientName) => {
        navigate(`/email-threads?client=${encodeURIComponent(clientName)}`);
    };

    const handleAddQuote = (clientName) => {
        navigate(`/quotes?client=${encodeURIComponent(clientName)}`);
    };

    return (
        <div style={{ overflowX: 'auto' }}>
            <table>
                <thead>
                    <tr>
                        <th>Client</th>
                        <th>Phone</th>
                        <th>Stage</th>
                        <th>Priority</th>
                        <th>Last Update</th>
                        <th>Remark</th>
                        <th>Follow-up</th>
                        <th>Blocker</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {deals.map(deal => (
                        <tr key={deal.id}>
                            <td style={{ fontWeight: '500' }}>{deal.clientName}</td>
                            <td className="text-secondary">{deal.phoneNumber || '-'}</td>
                            <td>
                                <span className={`badge ${getStageBadgeColor(deal.stage)}`}>
                                    {deal.stage}
                                </span>
                            </td>
                            <td>
                                <span className={`badge ${deal.priority === 'High' ? 'badge-danger' : deal.priority === 'Low' ? 'badge-success' : 'badge-warning'}`}>
                                    {deal.priority || 'Medium'}
                                </span>
                            </td>
                            <td className="text-secondary" style={{ fontSize: '0.875rem' }}>
                                {deal.lastUpdate ? format(new Date(deal.lastUpdate), 'MMM dd, yyyy') : '-'}
                            </td>
                            <td>
                                {deal.assignedTo && (
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
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
                                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                    <button
                                        className="icon-action-btn"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem' }}
                                        onClick={() => onEdit(deal)}
                                        title="Edit deal"
                                    >
                                        <Edit2 size={14} />
                                        <span className="icon-action-label">Update</span>
                                    </button>
                                    <button
                                        className="icon-action-btn thread-btn"
                                        onClick={() => handleAddThread(deal.clientName)}
                                        title="Add Email Thread"
                                    >
                                        <Mail size={14} />
                                        <span className="icon-action-label">Thread</span>
                                    </button>
                                    <button
                                        className="icon-action-btn quote-btn"
                                        onClick={() => handleAddQuote(deal.clientName)}
                                        title="Add Quote"
                                    >
                                        <FileSpreadsheet size={14} />
                                        <span className="icon-action-label">Quote</span>
                                    </button>
                                    <button
                                        className="icon-action-btn"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem',
                                            background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--border)' }}
                                        onClick={() => onCloseDeal(deal.id)}
                                        title="Mark as closed"
                                    >
                                        <Archive size={14} />
                                        <span className="icon-action-label">Close</span>
                                    </button>
                                    <button
                                        className="icon-action-btn"
                                        style={{ color: 'var(--danger)' }}
                                        onClick={() => onDelete(deal.id)}
                                        title="Delete deal"
                                    >
                                        <Trash2 size={14} />
                                        <span className="icon-action-label" style={{ color: 'var(--danger)' }}>Delete</span>
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
