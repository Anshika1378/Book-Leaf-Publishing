import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useSSE } from '../services/sse';
import { Navbar } from '../components/common/Navbar';
import { StatCard } from '../components/common/StatCard';
import { TicketDetailDrawer } from '../components/admin/TicketDetailDrawer';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/common/Badge';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import {
  Inbox,
  Clock,
  CheckCircle2,
  Sparkles,
  Search,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
];

const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];

export function AdminDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('urgency');

  // SSE Real-time sync
  const { isConnected } = useSSE({
    onTicketUpdate: (updatedTicket) => {
      if (!updatedTicket) return;
      setTickets((prev) =>
        prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t))
      );
      loadStats();
    },
    onTicketDeleted: (deletedTicketId) => {
      setTickets((prev) => {
        const remaining = prev.filter((t) => t.id !== deletedTicketId);
        if (selectedTicketId === deletedTicketId) {
          setSelectedTicketId(remaining[0]?.id || null);
        }
        return remaining;
      });
      loadStats();
    },
    onNewResponse: (ticketId, response, updatedTicket) => {
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id === ticketId) {
            const currentResponses = t.responses || [];
            const exists = currentResponses.some((r) => r.id === response.id);
            return {
              ...t,
              status: updatedTicket ? updatedTicket.status : t.status,
              responses: exists ? currentResponses : [...currentResponses, response],
            };
          }
          return t;
        })
      );
      loadStats();
    },
    onNewTicket: (newTicket) => {
      setTickets((prev) => {
        if (prev.some((t) => t.id === newTicket.id)) return prev;
        return [newTicket, ...prev];
      });
      loadStats();
    },
  });

  const handleDeleteClick = (ticketId) => {
    const t = tickets.find((item) => item.id === ticketId);
    setTicketToDelete(t || { id: ticketId, subject: '' });
  };

  const handleConfirmDelete = async () => {
    if (!ticketToDelete) return;
    setIsDeleting(true);
    try {
      await api.tickets.delete(ticketToDelete.id);
      setTickets((prev) => {
        const remaining = prev.filter((t) => t.id !== ticketToDelete.id);
        if (selectedTicketId === ticketToDelete.id) {
          setSelectedTicketId(remaining[0]?.id || null);
        }
        return remaining;
      });
      if (mobileShowDetail) {
        setMobileShowDetail(false);
      }
      setTicketToDelete(null);
      await loadStats();
    } catch (err) {
      alert(err.message || 'Failed to delete ticket.');
    } finally {
      setIsDeleting(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.tickets.getStats();
      setStats(res.stats);
    } catch (e) {
      console.warn('Failed to load stats:', e);
    }
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await api.tickets.getAll();
      const all = res.tickets || [];
      setTickets(all);
      if (all.length > 0) {
        setSelectedTicketId((prev) => {
          const stillExists = all.some((t) => t.id === prev);
          return stillExists && prev ? prev : all[0].id;
        });
      } else {
        setSelectedTicketId(null);
      }
      await loadStats();
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Filter & Sort Logic
  const filteredTickets = tickets
    .filter((t) => {
      if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
      if (selectedPriority !== 'All' && t.priority !== selectedPriority) return false;
      if (selectedStatus !== 'All' && t.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.authorName.toLowerCase().includes(q) ||
          (t.bookTitle && t.bookTitle.toLowerCase().includes(q)) ||
          t.id.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);

      const statusWeight = (s) => (s === 'Resolved' || s === 'Closed' ? 0 : 1);
      const sDiff = statusWeight(b.status) - statusWeight(a.status);
      if (sDiff !== 0) return sDiff;

      const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      const pDiff = (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
      if (pDiff !== 0) return pDiff;

      return new Date(a.createdAt) - new Date(b.createdAt);
    });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || filteredTickets[0] || null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar isConnected={isConnected} />

      <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '12px', width: '100%', boxSizing: 'border-box' }}>
        {/* Ops Header */}
        <div
          className="glass-panel"
          style={{
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Operations & Support Queue
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#6366f1',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}
              >
                AI Assisted Triage
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Real-time author ticketing, AI-assisted drafts, and SLA triage.
            </p>
          </div>

          <button
            onClick={loadTickets}
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <RefreshCw size={13} />
            <span className="hide-on-small">Refresh Queue</span>
          </button>
        </div>

        {/* Operational Metrics Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <StatCard
            title="Total Tickets"
            value={stats?.tickets?.total || tickets.length}
            subtitle="10 authors catalog"
            icon={Inbox}
            accentColor="#3b82f6"
          />

          <StatCard
            title="Open"
            value={stats?.tickets?.open || tickets.filter((t) => t.status === 'Open').length}
            subtitle="Needs team triage"
            icon={Clock}
            accentColor="#f59e0b"
            badgeText="SLA Active"
          />

          <StatCard
            title="Critical & High"
            value={(stats?.tickets?.critical || 0) + (stats?.tickets?.high || 0)}
            subtitle="ISBN & overdue payout"
            icon={ShieldAlert}
            accentColor="#ef4444"
            badgeText="Urgent"
          />

          <StatCard
            title="In Progress"
            value={stats?.tickets?.inProgress || tickets.filter((t) => t.status === 'In Progress').length}
            subtitle="Active threads"
            icon={Sparkles}
            accentColor="#8b5cf6"
          />

          <StatCard
            title="Resolved"
            value={stats?.tickets?.resolved || tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length}
            subtitle="Closed inquiries"
            icon={CheckCircle2}
            accentColor="#10b981"
          />
        </div>

        {/* Search, Filter & Sort Controls */}
        <div
          className="glass-panel"
          style={{
            padding: '14px',
            marginBottom: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search
              size={15}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search author, title, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input"
              style={{ paddingLeft: '32px', fontSize: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="glass-input"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="glass-input"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}
            >
              <option value="All">All Priorities</option>
              {PRIORITIES.filter((p) => p !== 'All').map((p) => (
                <option key={p} value={p}>
                  {p} Priority
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="glass-input"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}
            >
              <option value="All">All Statuses</option>
              {STATUSES.filter((s) => s !== 'All').map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="glass-input"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', border: '1px solid #3b82f6' }}
            >
              <option value="urgency">Urgent & Oldest (SLA)</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Master-Detail Split View (Responsive) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: mobileShowDetail ? '1fr' : 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Tickets Queue List */}
          <div
            className="glass-panel"
            style={{
              display: mobileShowDetail && window.innerWidth < 860 ? 'none' : 'flex',
              padding: '14px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              maxHeight: '900px',
              overflowY: 'auto',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 6px 6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Queue ({filteredTickets.length})
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Click to inspect
              </span>
            </div>

            {filteredTickets.map((t) => {
              const isSelected = t.id === selectedTicket?.id;
              const isCritical = t.priority === 'Critical';
              const isHigh = t.priority === 'High';

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTicketId(t.id);
                    setMobileShowDetail(true);
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-primary)',
                    border: isSelected
                      ? '1px solid #059669'
                      : isCritical && t.status === 'Open'
                      ? '1px solid rgba(239, 68, 68, 0.5)'
                      : isHigh && t.status === 'Open'
                      ? '1px solid rgba(245, 158, 11, 0.4)'
                      : '1px solid var(--border-color)',
                    boxShadow: isCritical && t.status === 'Open' ? '0 0 10px rgba(239, 68, 68, 0.15)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#10b981' }}>
                        {t.id}
                      </span>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <StatusBadge status={t.status} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(t.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          color: 'var(--text-muted)',
                          transition: 'color 0.15s ease, background-color 0.15s ease',
                        }}
                        title="Delete ticket"
                        aria-label="Delete ticket"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-muted)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      marginBottom: '4px',
                      lineHeight: 1.3,
                    }}
                  >
                    {t.subject}
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{t.authorName}</strong>
                    <span style={{ margin: '0 4px', color: 'var(--border-color)' }}>•</span>
                    <span>{t.bookTitle || 'General'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <CategoryBadge category={t.category} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredTickets.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                No tickets found for selected filter.
              </div>
            )}
          </div>

          {/* Right Column: Ticket Detail Drawer */}
          <div style={{ minWidth: 0 }}>
            {selectedTicket ? (
              <TicketDetailDrawer
                ticket={selectedTicket}
                onBackToQueue={() => setMobileShowDetail(false)}
                onDeleteTicket={handleDeleteClick}
                onTicketUpdated={(updated) => {
                  setTickets((prev) =>
                    prev.map((t) => (t.id === updated.id ? updated : t))
                  );
                }}
                onResponseSent={(updated, response) => {
                  setTickets((prev) =>
                    prev.map((t) => (t.id === updated.id ? updated : t))
                  );
                }}
              />
            ) : (
              <div
                className="glass-panel"
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <Inbox size={32} style={{ margin: '0 auto 8px' }} />
                <h3>Select a ticket from the queue</h3>
              </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmDeleteModal
        isOpen={!!ticketToDelete}
        ticketId={ticketToDelete?.id}
        ticketSubject={ticketToDelete?.subject}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => !isDeleting && setTicketToDelete(null)}
      />
    </div>
  );
}
