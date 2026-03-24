import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { AlertCircle, Calendar, Briefcase, Building, ShieldAlert } from 'lucide-react';
import DealsTable from './DealsTable';
import DealForm from './DealForm';

const API_BASE = '';

export default function Dashboard() {
    const [metrics, setMetrics] = useState(null);
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDeal, setEditingDeal] = useState(null);
    const [deletingDealId, setDeletingDealId] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStage, setFilterStage] = useState('All');
    const [filterPriority, setFilterPriority] = useState('All');
    const [filterAssignee, setFilterAssignee] = useState('All');

    const fetchData = async () => {
        try {
            const [metricsRes, dealsRes] = await Promise.all([
                axios.get(`${API_BASE}/metrics`),
                axios.get(`${API_BASE}/deals`)
            ]);
            setMetrics(metricsRes.data);
            setDeals(dealsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
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

    const uniqueAssignees = [...new Set(deals.map(d => d.assignedTo).filter(Boolean))];
    const filteredDeals = deals.filter(deal => {
        const matchesSearch = deal.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (deal.phoneNumber && deal.phoneNumber.includes(searchQuery));
        const matchesStage = filterStage === 'All' || deal.stage === filterStage;
        const matchesPriority = filterPriority === 'All' || deal.priority === filterPriority;
        const matchesAssignee = filterAssignee === 'All' || deal.assignedTo === filterAssignee;
        
        return matchesSearch && matchesStage && matchesPriority && matchesAssignee;
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
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className={`btn-secondary ${isFilterOpen ? 'active' : ''}`} onClick={() => setIsFilterOpen(!isFilterOpen)}>
                            {isFilterOpen ? '✕ Close Filters' : '🔍 Filter Deals'}
                        </button>
                        <button className="btn-primary" onClick={() => { window.scrollTo({ top: 0, behavior: 'instant' }); handleAddNewDeal(); }}>+ Create New Deal</button>
                    </div>

                    {/* Filter Popup Menu */}
                    {isFilterOpen && (
                        <div className="glass-panel animate-fade-in" style={{ 
                            position: 'absolute', 
                            top: '100%', 
                            right: 'auto', 
                            marginTop: '0.5rem', 
                            padding: '1.5rem', 
                            zIndex: 50, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '1rem',
                            minWidth: '320px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.15)' 
                        }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Filter Pipeline</h4>
                            <input 
                                placeholder="Search clients or phones..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'white' }}
                            />
                            <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', cursor: 'pointer' }}>
                                <option value="All">Stage: All</option>
                                <option value="Discovery">Discovery</option>
                                <option value="Proposal">Proposal</option>
                                <option value="Negotiation">Negotiation</option>
                                <option value="Won">Won</option>
                            </select>
                            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', cursor: 'pointer' }}>
                                <option value="All">Priority: All</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                            <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', cursor: 'pointer' }}>
                                <option value="All">Assigned: All</option>
                                {uniqueAssignees.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => { setSearchQuery(''); setFilterStage('All'); setFilterPriority('All'); setFilterAssignee('All'); setIsFilterOpen(false); }}>
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <DealsTable deals={filteredDeals} onEdit={handleEditDeal} onDelete={handleDeleteDeal} onCloseDeal={handleCloseDeal} />
            </div>

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
