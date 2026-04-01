import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Mail, Plus, Trash2, Edit2, ChevronDown, ChevronUp, User, X, Check, ExternalLink } from 'lucide-react';

const API_BASE = '/api';

export default function EmailThreads() {
    const [threads, setThreads] = useState([]); // Array directly from DB
    const [selectedClient, setSelectedClient] = useState('');
    const [newThread, setNewThread] = useState('');
    const [threadLink, setThreadLink] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [expandedClients, setExpandedClients] = useState({});
    const [customClient, setCustomClient] = useState('');
    const [useCustom, setUseCustom] = useState(false);
    const [deals, setDeals] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editLink, setEditLink] = useState('');

    // Load deals from API
    useEffect(() => {
        axios.get(`${API_BASE}/deals`).then(res => setDeals(res.data)).catch(() => {});
    }, []);

    // Load threads from API
    const fetchThreads = () => {
        axios.get(`${API_BASE}/email-threads`)
            .then(res => setThreads(res.data))
            .catch(err => console.error("Failed to load threads:", err));
    };

    useEffect(() => {
        fetchThreads();
    }, []);

    // Handle ?client= URL param to auto-open form
    useEffect(() => {
        const clientParam = searchParams.get('client');
        if (clientParam) {
            setIsAdding(true);
            setSelectedClient(clientParam);
            // Clear the URL param so it doesn't re-trigger
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const clientName = useCustom ? customClient.trim() : selectedClient;

    const handleAddThread = async () => {
        if (!clientName || !newThread.trim()) return;
        try {
            await axios.post(`${API_BASE}/email-threads`, {
                clientName,
                content: newThread.trim(),
                link: threadLink.trim()
            });
            fetchThreads();
            resetForm();
            setExpandedClients(prev => ({ ...prev, [clientName]: true }));
        } catch (error) {
            console.error("Failed to add thread:", error);
            alert("Failed to save thread to database.");
        }
    };

    const handleUpdateThread = async (id) => {
        if (!editContent.trim()) return;
        try {
            await axios.put(`${API_BASE}/email-threads/${id}`, {
                content: editContent.trim(),
                link: editLink.trim()
            });
            setEditingId(null);
            fetchThreads();
        } catch (error) {
            console.error("Failed to update thread:", error);
            alert("Failed to update thread in database.");
        }
    };

    const handleDeleteThread = async (id) => {
        try {
            await axios.delete(`${API_BASE}/email-threads/${id}`);
            fetchThreads();
        } catch (error) {
            console.error("Failed to delete thread:", error);
        }
    };

    const startEdit = (thread) => {
        setEditingId(thread.id);
        setEditContent(thread.content);
        setEditLink(thread.link || '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditContent('');
        setEditLink('');
    };

    const resetForm = () => {
        setNewThread('');
        setThreadLink('');
        setIsAdding(false);
        setCustomClient('');
        setUseCustom(false);
    };

    const toggleExpand = (client) => {
        setExpandedClients(prev => ({ ...prev, [client]: !prev[client] }));
    };

    // Group threads by client
    const groupedThreads = threads.reduce((acc, thread) => {
        if (!acc[thread.clientName]) acc[thread.clientName] = [];
        acc[thread.clientName].push(thread);
        return acc;
    }, {});

    const allClients = deals.map(d => d.clientName).filter(Boolean);
    const clientsWithThreads = Object.keys(groupedThreads);
    const displayClients = [...new Set([...clientsWithThreads, ...allClients])];

    const linkify = (text) => {
        if (!text) return '';
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.split(urlRegex).map((part, i) => {
            if (part.match(urlRegex)) {
                return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-accent)', textDecoration: 'underline' }}>{part}</a>;
            }
            return part;
        });
    };

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--info-bg)', padding: '0.75rem', borderRadius: '12px' }}>
                        <Mail color="var(--info)" size={28} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0 }}>Email Threads</h2>
                        <p className="text-secondary" style={{ margin: 0, fontSize: '0.85rem' }}>Full conversation history per client</p>
                    </div>
                </div>
                <button className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    onClick={() => setIsAdding(true)}>
                    <Plus size={14} /> Add Thread
                </button>
            </div>

            {/* Add Thread Form */}
            {isAdding && (
                <div className="glass-panel animate-fade-in" style={{ padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid var(--primary-accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0 }}>Paste Email Thread</h4>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                            onClick={resetForm}>
                            <X size={18} color="var(--text-secondary)" />
                        </button>
                    </div>

                    {/* Client Selector */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Select Client</label>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            {!useCustom ? (
                                <>
                                    <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} style={{ flex: 1 }}>
                                        <option value="">— Choose a client —</option>
                                        {displayClients.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}
                                        onClick={() => setUseCustom(true)}>
                                        + New Client
                                    </button>
                                </>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        value={customClient}
                                        onChange={e => setCustomClient(e.target.value)}
                                        placeholder="Type client name..."
                                        style={{ flex: 1 }}
                                        autoFocus
                                    />
                                    <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}
                                        onClick={() => { setUseCustom(false); setCustomClient(''); }}>
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Gmail Thread Link */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Gmail Thread Link (optional)</label>
                        <input
                            type="url"
                            value={threadLink}
                            onChange={e => setThreadLink(e.target.value)}
                            placeholder="Paste Gmail thread URL here (e.g. https://mail.google.com/mail/u/0/#inbox/...)"
                        />
                    </div>

                    {/* Thread Textarea */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email Thread Content</label>
                        <textarea
                            value={newThread}
                            onChange={e => setNewThread(e.target.value)}
                            rows={8}
                            placeholder="Paste the full email thread here (copy from Gmail, Outlook, etc.)..."
                            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button className="btn-secondary" onClick={resetForm}>
                            Cancel
                        </button>
                        <button className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            onClick={handleAddThread}
                            disabled={!clientName || !newThread.trim()}>
                            <Check size={14} /> Save Thread
                        </button>
                    </div>
                </div>
            )}

            {/* Threads Per Client */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {clientsWithThreads.length === 0 && !isAdding && (
                    <div className="glass-panel" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Mail size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>No email threads saved yet. Click <strong>Add Thread</strong> to start.</p>
                    </div>
                )}

                {clientsWithThreads.map(client => (
                    <div key={client} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                        {/* Client Row Header */}
                        <div
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => toggleExpand(client)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ background: 'var(--primary-bg)', padding: '0.5rem', borderRadius: '8px' }}>
                                    <User size={16} color="var(--primary-accent)" />
                                </div>
                                <div>
                                    <strong style={{ fontSize: '0.95rem' }}>{client}</strong>
                                    <span className="text-secondary" style={{ fontSize: '0.8rem', marginLeft: '0.75rem' }}>
                                        {groupedThreads[client].length} thread{groupedThreads[client].length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                            {expandedClients[client] ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
                        </div>

                        {/* Thread List */}
                        {expandedClients[client] && (
                            <div style={{ borderTop: '1px solid var(--border)' }}>
                                {groupedThreads[client].map((thread, idx) => (
                                    <div key={thread.id} style={{
                                        padding: '1rem 1.25rem',
                                        borderBottom: idx < groupedThreads[client].length - 1 ? '1px solid var(--border)' : 'none',
                                        background: 'rgba(0,0,0,0.01)'
                                    }}>
                                        {/* View Mode */}
                                        {editingId !== thread.id ? (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <span className="text-secondary" style={{ fontSize: '0.78rem' }}>
                                                            Saved on {thread.savedAt}
                                                        </span>
                                                        {thread.link && (
                                                            <a href={thread.link} target="_blank" rel="noopener noreferrer"
                                                                className="btn-secondary"
                                                                style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                                    padding: '0.2rem 0.6rem', fontSize: '0.75rem', textDecoration: 'none',
                                                                    color: 'var(--info)', borderColor: 'rgba(56, 189, 248, 0.25)'
                                                                }}>
                                                                <ExternalLink size={12} /> Open Link
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                        <button
                                                            onClick={() => startEdit(thread)}
                                                            className="btn-secondary"
                                                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                            title="Edit thread">
                                                            <Edit2 size={12} /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteThread(thread.id)}
                                                            className="btn-danger"
                                                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'transparent', borderColor: 'transparent', padding: '0' }}
                                                            title="Delete thread">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    margin: 0,
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word',
                                                    fontSize: '0.83rem',
                                                    fontFamily: 'inherit',
                                                    lineHeight: '1.6',
                                                    color: 'var(--text-primary)',
                                                    background: 'var(--surface)',
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border)',
                                                    maxHeight: '320px',
                                                    overflowY: 'auto'
                                                }}>
                                                    {linkify(thread.content)}
                                                </div>
                                            </>
                                        ) : (
                                            /* Edit Mode */
                                            <div className="animate-fade-in" style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                <div style={{ marginBottom: '1rem' }}>
                                                    <label className="text-secondary" style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem' }}>Update Link</label>
                                                    <input type="url" value={editLink} onChange={e => setEditLink(e.target.value)} placeholder="https://..." style={{ fontSize: '0.8rem', padding: '0.4rem' }} />
                                                </div>
                                                <div style={{ marginBottom: '1rem' }}>
                                                    <label className="text-secondary" style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem' }}>Update Content</label>
                                                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={6} style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }} />
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <button className="btn-secondary" onClick={cancelEdit} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>Cancel</button>
                                                    <button className="btn-primary" onClick={() => handleUpdateThread(thread.id)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }} disabled={!editContent.trim()}>
                                                        <Check size={12} /> Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
