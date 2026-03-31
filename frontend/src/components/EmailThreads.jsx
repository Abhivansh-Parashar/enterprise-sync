import { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, ChevronDown, ChevronUp, User, X, Check } from 'lucide-react';

export default function EmailThreads({ deals = [] }) {
    const [threads, setThreads] = useState({});       // { clientName: [{ id, content, savedAt }] }
    const [selectedClient, setSelectedClient] = useState('');
    const [newThread, setNewThread] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [expandedClients, setExpandedClients] = useState({});
    const [customClient, setCustomClient] = useState('');
    const [useCustom, setUseCustom] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('emailThreads');
        if (stored) {
            try { setThreads(JSON.parse(stored)); } catch (_) {}
        }
    }, []);

    const save = (updated) => {
        setThreads(updated);
        localStorage.setItem('emailThreads', JSON.stringify(updated));
    };

    const clientName = useCustom ? customClient.trim() : selectedClient;

    const handleAddThread = () => {
        if (!clientName || !newThread.trim()) return;
        const updated = { ...threads };
        if (!updated[clientName]) updated[clientName] = [];
        updated[clientName] = [
            { id: Date.now(), content: newThread.trim(), savedAt: new Date().toLocaleString() },
            ...updated[clientName]
        ];
        save(updated);
        setNewThread('');
        setIsAdding(false);
        setSelectedClient(clientName);
        setExpandedClients(prev => ({ ...prev, [clientName]: true }));
        setCustomClient('');
        setUseCustom(false);
    };

    const handleDeleteThread = (client, id) => {
        const updated = { ...threads };
        updated[client] = updated[client].filter(t => t.id !== id);
        if (updated[client].length === 0) delete updated[client];
        save(updated);
    };

    const toggleExpand = (client) => {
        setExpandedClients(prev => ({ ...prev, [client]: !prev[client] }));
    };

    const allClients = deals.map(d => d.clientName).filter(Boolean);
    const clientsWithThreads = Object.keys(threads);
    // Merge: show all clients from deals + any saved thread clients not in deals
    const displayClients = [...new Set([...clientsWithThreads, ...allClients])];

    return (
        <div className="animate-fade-in" style={{ marginBottom: '2.5rem' }}>
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--info-bg)', padding: '0.75rem', borderRadius: '12px' }}>
                        <Mail color="var(--info)" size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Email Threads</h3>
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
                <div className="glass-panel animate-fade-in" style={{ padding: '1.25rem', marginBottom: '1rem', border: '1px solid var(--primary-accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0 }}>Paste Email Thread</h4>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                            onClick={() => { setIsAdding(false); setNewThread(''); setCustomClient(''); setUseCustom(false); }}>
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
                        <button className="btn-secondary" onClick={() => { setIsAdding(false); setNewThread(''); setCustomClient(''); setUseCustom(false); }}>
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
                                        {threads[client]?.length} thread{threads[client]?.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                            {expandedClients[client] ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
                        </div>

                        {/* Thread List */}
                        {expandedClients[client] && (
                            <div style={{ borderTop: '1px solid var(--border)' }}>
                                {threads[client].map((thread, idx) => (
                                    <div key={thread.id} style={{
                                        padding: '1rem 1.25rem',
                                        borderBottom: idx < threads[client].length - 1 ? '1px solid var(--border)' : 'none',
                                        background: 'rgba(0,0,0,0.01)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <span className="text-secondary" style={{ fontSize: '0.78rem' }}>
                                                Saved on {thread.savedAt}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteThread(client, thread.id)}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.1rem', display: 'flex', alignItems: 'center' }}
                                                title="Delete thread">
                                                <Trash2 size={14} color="var(--danger)" />
                                            </button>
                                        </div>
                                        <pre style={{
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
                                            {thread.content}
                                        </pre>
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
