import { useState, useEffect } from 'react';
import { FileSpreadsheet, ExternalLink, Plus, Trash2, ChevronDown, ChevronUp, User, X, Check, Edit2 } from 'lucide-react';

export default function QuotesSection({ deals = [] }) {
    // { clientName: [{ id, url, label, savedAt }] }
    const [sheets, setSheets] = useState({});
    const [isAdding, setIsAdding] = useState(false);
    const [selectedClient, setSelectedClient] = useState('');
    const [customClient, setCustomClient] = useState('');
    const [useCustom, setUseCustom] = useState(false);
    const [sheetUrl, setSheetUrl] = useState('');
    const [sheetLabel, setSheetLabel] = useState('');
    const [expandedClients, setExpandedClients] = useState({});

    useEffect(() => {
        const stored = localStorage.getItem('quotesSheets');
        if (stored) {
            try { setSheets(JSON.parse(stored)); } catch (_) {}
        }
    }, []);

    const save = (updated) => {
        setSheets(updated);
        localStorage.setItem('quotesSheets', JSON.stringify(updated));
    };

    const toEmbedUrl = (url) => {
        if (!url) return '';
        try {
            const u = new URL(url);
            if (u.hostname === 'docs.google.com') {
                let base = url.split('/edit')[0].split('/view')[0].split('/pub')[0];
                return `${base}/pub?output=html&widget=true&headers=false`;
            }
        } catch (_) {}
        return url;
    };

    const clientName = useCustom ? customClient.trim() : selectedClient;

    const handleAdd = () => {
        if (!clientName || !sheetUrl.trim()) return;
        const updated = { ...sheets };
        if (!updated[clientName]) updated[clientName] = [];
        updated[clientName] = [
            { id: Date.now(), url: sheetUrl.trim(), label: sheetLabel.trim() || 'Quote Sheet', savedAt: new Date().toLocaleString() },
            ...updated[clientName]
        ];
        save(updated);
        resetForm();
        setExpandedClients(prev => ({ ...prev, [clientName]: true }));
    };

    const handleDelete = (client, id) => {
        const updated = { ...sheets };
        updated[client] = updated[client].filter(s => s.id !== id);
        if (updated[client].length === 0) delete updated[client];
        save(updated);
    };

    const resetForm = () => {
        setIsAdding(false);
        setSheetUrl('');
        setSheetLabel('');
        setCustomClient('');
        setUseCustom(false);
    };

    const toggleExpand = (client) => {
        setExpandedClients(prev => ({ ...prev, [client]: !prev[client] }));
    };

    const allClients = deals.map(d => d.clientName).filter(Boolean);
    const clientsWithSheets = Object.keys(sheets);
    const displayClients = [...new Set([...clientsWithSheets, ...allClients])];

    return (
        <div className="animate-fade-in" style={{ marginBottom: '2.5rem' }}>
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--success-bg)', padding: '0.75rem', borderRadius: '12px' }}>
                        <FileSpreadsheet color="var(--success)" size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Quotes Sheets</h3>
                        <p className="text-secondary" style={{ margin: 0, fontSize: '0.85rem' }}>Google Sheets linked per client</p>
                    </div>
                </div>
                <button className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    onClick={() => setIsAdding(true)}>
                    <Plus size={14} /> Add Sheet
                </button>
            </div>

            {/* Add Sheet Form */}
            {isAdding && (
                <div className="glass-panel animate-fade-in" style={{ padding: '1.25rem', marginBottom: '1rem', border: '1px solid var(--primary-accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0 }}>Link a Quote Sheet</h4>
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
                                    <input type="text" value={customClient} onChange={e => setCustomClient(e.target.value)}
                                        placeholder="Type client name..." style={{ flex: 1 }} autoFocus />
                                    <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}
                                        onClick={() => { setUseCustom(false); setCustomClient(''); }}>
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Sheet Label */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Sheet Label (optional)</label>
                        <input type="text" value={sheetLabel} onChange={e => setSheetLabel(e.target.value)}
                            placeholder="e.g. Q1 Pricing, Final Quote..." />
                    </div>

                    {/* Sheet URL */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Google Sheets Link</label>
                        <input type="url" value={sheetUrl} onChange={e => setSheetUrl(e.target.value)}
                            placeholder="Paste your Google Sheets link here..." />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button className="btn-secondary" onClick={resetForm}>Cancel</button>
                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            onClick={handleAdd} disabled={!clientName || !sheetUrl.trim()}>
                            <Check size={14} /> Save Sheet
                        </button>
                    </div>
                </div>
            )}

            {/* Sheets Per Client */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {clientsWithSheets.length === 0 && !isAdding && (
                    <div className="glass-panel" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <FileSpreadsheet size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>No quote sheets linked yet. Click <strong>Add Sheet</strong> to link a Google Sheet to a client.</p>
                    </div>
                )}

                {clientsWithSheets.map(client => (
                    <div key={client} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                        {/* Client Row Header */}
                        <div
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => toggleExpand(client)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ background: 'var(--success-bg)', padding: '0.5rem', borderRadius: '8px' }}>
                                    <User size={16} color="var(--success)" />
                                </div>
                                <div>
                                    <strong style={{ fontSize: '0.95rem' }}>{client}</strong>
                                    <span className="text-secondary" style={{ fontSize: '0.8rem', marginLeft: '0.75rem' }}>
                                        {sheets[client]?.length} sheet{sheets[client]?.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                            {expandedClients[client] ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
                        </div>

                        {/* Sheet List */}
                        {expandedClients[client] && (
                            <div style={{ borderTop: '1px solid var(--border)' }}>
                                {sheets[client].map((sheet, idx) => (
                                    <div key={sheet.id} style={{
                                        padding: '1rem 1.25rem',
                                        borderBottom: idx < sheets[client].length - 1 ? '1px solid var(--border)' : 'none',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <div>
                                                <strong style={{ fontSize: '0.9rem' }}>{sheet.label}</strong>
                                                <span className="text-secondary" style={{ fontSize: '0.78rem', marginLeft: '0.75rem' }}>
                                                    Added {sheet.savedAt}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <a href={sheet.url} target="_blank" rel="noopener noreferrer"
                                                    className="btn-secondary"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', fontSize: '0.8rem', textDecoration: 'none' }}>
                                                    <ExternalLink size={13} /> Open
                                                </a>
                                                <button onClick={() => handleDelete(client, sheet.id)}
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.1rem', display: 'flex', alignItems: 'center' }}
                                                    title="Remove sheet">
                                                    <Trash2 size={14} color="var(--danger)" />
                                                </button>
                                            </div>
                                        </div>
                                        {/* Embedded Sheet Preview */}
                                        <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                            <iframe
                                                src={toEmbedUrl(sheet.url)}
                                                title={`${client} - ${sheet.label}`}
                                                style={{ width: '100%', height: '360px', border: 'none', display: 'block' }}
                                                loading="lazy"
                                            />
                                        </div>
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
