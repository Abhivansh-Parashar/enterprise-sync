import { useState, useEffect } from 'react';
import { FileSpreadsheet, ExternalLink, Edit2, Check, X } from 'lucide-react';

export default function QuotesSection() {
    const [sheetUrl, setSheetUrl] = useState('');
    const [savedUrl, setSavedUrl] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [embedUrl, setEmbedUrl] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('quotesSheetUrl');
        if (stored) {
            setSavedUrl(stored);
            setEmbedUrl(toEmbedUrl(stored));
        }
    }, []);

    const toEmbedUrl = (url) => {
        if (!url) return '';
        // Convert standard Google Sheets URL to embed URL
        try {
            const u = new URL(url);
            if (u.hostname === 'docs.google.com') {
                // Handle /edit, /view, /pub, or already /pub?output=html
                let base = url.split('/edit')[0].split('/view')[0].split('/pub')[0];
                return `${base}/pub?output=html&widget=true&headers=false`;
            }
        } catch (_) {}
        return url;
    };

    const handleSave = () => {
        const trimmed = sheetUrl.trim();
        setSavedUrl(trimmed);
        setEmbedUrl(toEmbedUrl(trimmed));
        localStorage.setItem('quotesSheetUrl', trimmed);
        setIsEditing(false);
        setSheetUrl('');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setSheetUrl('');
    };

    return (
        <div className="animate-fade-in" style={{ marginBottom: '2.5rem' }}>
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--success-bg)', padding: '0.75rem', borderRadius: '12px' }}>
                        <FileSpreadsheet color="var(--success)" size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Quotes Sheet</h3>
                        <p className="text-secondary" style={{ margin: 0, fontSize: '0.85rem' }}>Live Google Sheet with all shared quotes</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {savedUrl && !isEditing && (
                        <a href={savedUrl} target="_blank" rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', fontSize: '0.875rem', textDecoration: 'none' }}>
                            <ExternalLink size={14} /> Open Sheet
                        </a>
                    )}
                    {!isEditing && (
                        <button className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', fontSize: '0.875rem' }}
                            onClick={() => { setSheetUrl(savedUrl); setIsEditing(true); }}>
                            <Edit2 size={14} /> {savedUrl ? 'Change Link' : 'Add Sheet Link'}
                        </button>
                    )}
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
                {/* URL Input */}
                {isEditing && (
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <input
                            type="url"
                            value={sheetUrl}
                            onChange={(e) => setSheetUrl(e.target.value)}
                            placeholder="Paste your Google Sheets link here..."
                            style={{ flex: 1 }}
                            autoFocus
                        />
                        <button className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
                            onClick={handleSave} disabled={!sheetUrl.trim()}>
                            <Check size={14} /> Save Link
                        </button>
                        <button className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem' }}
                            onClick={handleCancel}>
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Sheet Embed */}
                {embedUrl && !isEditing ? (
                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <iframe
                            src={embedUrl}
                            title="Quotes Google Sheet"
                            style={{ width: '100%', height: '480px', border: 'none', display: 'block' }}
                            loading="lazy"
                        />
                    </div>
                ) : !isEditing && (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                        <FileSpreadsheet size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>No sheet linked yet. Click <strong>Add Sheet Link</strong> to embed your Google Sheets quotes.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
