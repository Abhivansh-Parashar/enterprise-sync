import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { AlertCircle, Calendar, Briefcase, Building, ShieldAlert, Archive, User, X } from 'lucide-react';
import DealsTable from './DealsTable';
import DealForm from './DealForm';
import QuotesSection from './QuotesSection';
import EmailThreads from './EmailThreads';

const API_BASE = '/api';

export default function Dashboard() {
    const [metrics, setMetrics] = useState(null);
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDeal, setEditingDeal] = useState(null);
    const [deletingDealId, setDeletingDealId] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // LeetCode-style Filter states
    const [filterMatch, setFilterMatch] = useState('All');
    const [sortOption, setSortOption] = useState('newest');
    const [filters, setFilters] = useState({
        client: { active: false, operator: 'contains', value: '' },
        stage: { active: false, operator: 'is', value: 'Discovery' },
        priority: { active: false, operator: 'is', value: 'High' }
    });

    const fetchData = async () => {
        try {
            setError(null);
            const [metricsRes, dealsRes] = await Promise.all([
                axios.get(`${API_BASE}/metrics`),
                axios.get(`${API_BASE}/deals`)
            ]);
            setMetrics(metricsRes.data);
            setDeals(dealsRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message || 'Failed to connect to the server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddNewDeal = () => {
        setEditingDeal(null);
        setIsModalOpen(true);
    };

    const handleEditDeal = (deal) => {
        setEditingDeal(deal);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        fetchData(); // Refresh data after changes
    };

    const handleDeleteDeal = (id) => {
        setDeletingDealId(id);
    };

    const confirmDeleteDeal = async () => {
        if (!deletingDealId) return;
        try {
            await axios.delete(`${API_BASE}/deals/${deletingDealId}`);
            setDeletingDealId(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting deal:', error);
        }
    };

    const handleCloseDeal = async (id) => {
        try {
            await axios.put(`${API_BASE}/deals/${id}/close`);
            fetchData();
        } catch (error) {
            console.error('Error closing deal:', error);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            Loading dashboard data...
        </div>
    );

    if (error || !metrics) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', color: 'var(--danger)', gap: '1rem' }}>
            <ShieldAlert size={48} />
            <h2>Server Connection Failed</h2>
            <p>We hit a snag connecting to the database. (Turso Cold-Start Latency)</p>
            <button className="btn-primary" onClick={() => { setLoading(true); fetchData(); }}>Try Again</button>
        </div>
    );

    const uniqueAssignees = [...new Set(deals.map(d => d.assignedTo).filter(Boolean))];
    
    const filteredDeals = deals.filter(deal => {
        const activeFilters = Object.values(filters).filter(f => f.active);
        if (activeFilters.length === 0) return true;

        const evaluateFilter = (fKey) => {
            const f = filters[fKey];
            if (!f.active) return filterMatch === 'All' ? true : false;
            let val = deal[fKey] || '';
            if (fKey === 'client') {
                 val = deal.clientName || '';
                 if (f.operator === 'contains') return val.toLowerCase().includes(f.value.toLowerCase());
                 if (f.operator === 'is') return val.toLowerCase() === f.value.toLowerCase();
                 return true;
            }
            if (fKey === 'stage' || fKey === 'priority') {
                 if (f.operator === 'is') return val === f.value;
                 if (f.operator === 'is not') return val !== f.value;
            }
            return true;
        };

        const checks = [
            filters.client.active ? evaluateFilter('client') : null,
            filters.stage.active ? evaluateFilter('stage') : null,
            filters.priority.active ? evaluateFilter('priority') : null
        ].filter(res => res !== null);

        if (filterMatch === 'All') {
            return checks.every(res => res === true);
        } else {
            return checks.some(res => res === true);
        }
    });

    const sortedDeals = [...filteredDeals].sort((a, b) => {
        if (sortOption === 'priority_desc' || sortOption === 'priority_asc') {
            const levels = { 'High': 3, 'Medium': 2, 'Low': 1 };
            const pA = levels[a.priority] || 2;
            const pB = levels[b.priority] || 2;
            if (pA !== pB) {
                return sortOption === 'priority_desc' ? pB - pA : pA - pB;
            }
        }
        if (sortOption === 'followup_asc' || sortOption === 'followup_desc') {
            const dateA = a.followUpDate ? new Date(a.followUpDate).getTime() : 0;
            const dateB = b.followUpDate ? new Date(b.followUpDate).getTime() : 0;
            if (dateA !== dateB) {
                if (dateA === 0) return 1;
                if (dateB === 0) return -1;
                return sortOption === 'followup_asc' ? dateA - dateB : dateB - dateA;
            }
        }
        return b.id - a.id;
    });

    return (
        <div className="animate-fade-in">
            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'var(--primary-bg)', padding: '0.75rem', borderRadius: '12px' }}>
                        <Briefcase color="var(--primary-accent)" size={28} />
                    </div>
                    <div>
                        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Active Deals</p>
                        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>{metrics.totalActive}</h2>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'var(--success-bg)', padding: '0.75rem', borderRadius: '12px' }}>
                        <Calendar color="var(--success)" size={28} />
                    </div>
                    <div>
                        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Follow-ups Today</p>
                        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>{metrics.followupsToday}</h2>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'var(--danger-bg)', padding: '0.75rem', borderRadius: '12px' }}>
                        <AlertCircle color="var(--danger)" size={28} />
                    </div>
                    <div>
                        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Overdue</p>
                        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>{metrics.overdue}</h2>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'var(--warning-bg)', padding: '0.75rem', borderRadius: '12px' }}>
                        <ShieldAlert color="var(--warning)" size={28} />
                    </div>
                    <div>
                        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Blocked Deals</p>
                        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>{metrics.blocked}</h2>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'var(--info-bg)', padding: '0.75rem', borderRadius: '12px' }}>
                        <Building color="var(--info)" size={28} />
                    </div>
                    <div>
                        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Awaiting Action</p>
                        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>{metrics.awaitingManager}</h2>
                    </div>
                </div>
            </div>

            {/* Alerts Row */}
            {metrics.alerts && metrics.alerts.length > 0 && (
                <div style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={20} color="var(--danger)" />
                        Action Items & Alerts
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {metrics.alerts.map((alert, idx) => {
                            let alertClass = '';
                            let icon = null;
                            if (alert.type === 'blocked' || alert.type === 'overdue') {
                                alertClass = 'badge-danger';
                                icon = <ShieldAlert size={16} />;
                            } else if (alert.type === 'stale') {
                                alertClass = 'badge-warning';
                                icon = <AlertCircle size={16} />;
                            } else {
                                alertClass = 'badge-info';
                                icon = <Calendar size={16} />;
                            }

                            return (
                                <div key={idx} className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span className={`badge ${alertClass}`} style={{ display: 'flex', gap: '0.25rem' }}>
                                            {icon} {alert.type.toUpperCase().replace('_', ' ')}
                                        </span>
                                        <strong>{alert.client}</strong>
                                        <span className="text-secondary">— {alert.message}</span>
                                    </div>
                                    <button className="btn-secondary" style={{ padding: '0.25rem 0.75rem' }} onClick={() => handleEditDeal(deals.find(d => d.id === alert.dealId))}>
                                        Review
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main Deals Table */}
            <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'visible' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'relative' }}>
                    <h3>Active Enterprise Sync Deals</h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <select className="btn-secondary" style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', outline: 'none' }} value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                            <option value="newest">Sort: By Latest</option>
                            <option value="priority_desc">Priority: High to Low</option>
                            <option value="priority_asc">Priority: Low to High</option>
                            <option value="followup_asc">Follow-up: Closest</option>
                            <option value="followup_desc">Follow-up: Farthest</option>
                        </select>
                        <button className={`btn-secondary ${isFilterOpen ? 'active' : ''}`} onClick={() => setIsFilterOpen(!isFilterOpen)}>
                            {isFilterOpen ? '✕ Close Filters' : '🔍 Filter Deals'}
                        </button>
                        <button className="btn-primary" onClick={() => { window.scrollTo({ top: 0, behavior: 'instant' }); handleAddNewDeal(); }}>+ Create New Deal</button>
                    </div>

                    {/* Filter Popup Menu (LeetCode Style) */}
                    {isFilterOpen && (
                        <div className="animate-fade-in" style={{ 
                            position: 'absolute', 
                            top: '100%', 
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginTop: '0.5rem', 
                            padding: '1.25rem', 
                            zIndex: 60, 
                            backgroundColor: '#282828',
                            color: '#E0E0E0',
                            borderRadius: '8px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '1rem',
                            minWidth: '500px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                            fontSize: '0.875rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: '600', color: 'white', fontSize: '1rem' }}>Match</span>
                                <select 
                                    value={filterMatch} 
                                    onChange={e => setFilterMatch(e.target.value)}
                                    style={{ background: '#333', color: 'white', border: '1px solid #444', borderRadius: '6px', padding: '0.3rem 0.5rem', outline: 'none' }}>
                                    <option value="All">All</option>
                                    <option value="Any">Any</option>
                                </select>
                                <span style={{ fontWeight: '600', color: 'white', fontSize: '1rem' }}>of the following filters:</span>
                            </div>

                            {/* Stage Row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input type="checkbox" checked={filters.stage.active} onChange={e => setFilters({...filters, stage: {...filters.stage, active: e.target.checked}})} 
                                    style={{ width: '18px', height: '18px', accentColor: '#4b5563', cursor: 'pointer', margin: 0 }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '90px' }}>
                                    <Archive size={16} color="#888" />
                                    <span style={{ color: '#aaa' }}>Stage</span>
                                </div>
                                <select style={{ background: '#333', color: 'white', border: '1px solid #444', borderRadius: '6px', padding: '0.4rem', width: '90px', outline: 'none' }}
                                    value={filters.stage.operator} onChange={e => setFilters({...filters, stage: {...filters.stage, operator: e.target.value}})}>
                                    <option value="is">is</option>
                                    <option value="is not">is not</option>
                                </select>
                                <select style={{ background: '#333', color: 'white', border: '1px solid #444', borderRadius: '6px', padding: '0.4rem', flex: 1, outline: 'none' }}
                                    value={filters.stage.value} onChange={e => setFilters({...filters, stage: {...filters.stage, value: e.target.value}})}>
                                    <option value="Discovery">Discovery</option>
                                    <option value="Going Well">Going Well</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Proposal">Proposal</option>
                                    <option value="Negotiation">Negotiation</option>
                                    <option value="Closing">Closing</option>
                                    <option value="Closed Won">Closed Won</option>
                                    <option value="Closed Lost">Closed Lost</option>
                                </select>
                                <button type="button" style={{ background: 'transparent', border: 'none', padding: 0 }} onClick={() => setFilters({...filters, stage: {...filters.stage, active: false}})}>
                                    <X size={16} color="#555" style={{ cursor: 'pointer' }} />
                                </button>
                            </div>

                            {/* Priority Row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input type="checkbox" checked={filters.priority.active} onChange={e => setFilters({...filters, priority: {...filters.priority, active: e.target.checked}})} 
                                    style={{ width: '18px', height: '18px', accentColor: '#4b5563', cursor: 'pointer', margin: 0 }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '90px' }}>
                                    <AlertCircle size={16} color="#888" />
                                    <span style={{ color: '#aaa' }}>Priority</span>
                                </div>
                                <select style={{ background: '#333', color: 'white', border: '1px solid #444', borderRadius: '6px', padding: '0.4rem', width: '90px', outline: 'none' }}
                                    value={filters.priority.operator} onChange={e => setFilters({...filters, priority: {...filters.priority, operator: e.target.value}})}>
                                    <option value="is">is</option>
                                    <option value="is not">is not</option>
                                </select>
                                <select style={{ background: '#333', color: 'white', border: '1px solid #444', borderRadius: '6px', padding: '0.4rem', flex: 1, outline: 'none' }}
                                    value={filters.priority.value} onChange={e => setFilters({...filters, priority: {...filters.priority, value: e.target.value}})}>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                                <button type="button" style={{ background: 'transparent', border: 'none', padding: 0 }} onClick={() => setFilters({...filters, priority: {...filters.priority, active: false}})}>
                                    <X size={16} color="#555" style={{ cursor: 'pointer' }} />
                                </button>
                            </div>


                            {/* Client Name Row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input type="checkbox" checked={filters.client.active} onChange={e => setFilters({...filters, client: {...filters.client, active: e.target.checked}})} 
                                    style={{ width: '18px', height: '18px', accentColor: '#4b5563', cursor: 'pointer', margin: 0 }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '90px' }}>
                                    <Briefcase size={16} color="#888" />
                                    <span style={{ color: '#aaa' }}>Client</span>
                                </div>
                                <select style={{ background: '#333', color: 'white', border: '1px solid #444', borderRadius: '6px', padding: '0.4rem', width: '90px', outline: 'none' }}
                                    value={filters.client.operator} onChange={e => setFilters({...filters, client: {...filters.client, operator: e.target.value}})}>
                                    <option value="contains">contains</option>
                                    <option value="is">is</option>
                                </select>
                                <input style={{ background: '#333', color: 'white', border: '1px solid #444', borderRadius: '6px', padding: '0.4rem', flex: 1, outline: 'none' }} 
                                    value={filters.client.value} onChange={e => setFilters({...filters, client: {...filters.client, value: e.target.value}})} placeholder="e.g. Acme corp" />
                                <button type="button" style={{ background: 'transparent', border: 'none', padding: 0 }} onClick={() => setFilters({...filters, client: {...filters.client, active: false}})}>
                                    <X size={16} color="#555" style={{ cursor: 'pointer' }} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <DealsTable deals={sortedDeals} onEdit={handleEditDeal} onDelete={handleDeleteDeal} onCloseDeal={handleCloseDeal} />
            </div>

            {/* Quotes Section */}
            <QuotesSection />

            {/* Email Threads Section */}
            <EmailThreads deals={deals} />

            {/* Deal Add/Edit Modal */}
            {isModalOpen && (
                <DealForm
                    deal={editingDeal}
                    onClose={handleModalClose}
                    apiBase={API_BASE}
                />
            )}

            {/* Custom Delete Confirmation Modal */}
            {deletingDealId && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-in" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <ShieldAlert size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ marginBottom: '0.5rem' }}>Delete Deal?</h3>
                        <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>This action is permanent and cannot be undone.</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            <button className="btn-secondary" onClick={() => setDeletingDealId(null)}>Cancel</button>
                            <button className="btn-primary" style={{ background: 'var(--danger)', boxShadow: '0 4px 6px -1px rgba(239,68,68,0.4)' }} onClick={confirmDeleteDeal}>
                                Yes, Delete it
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
