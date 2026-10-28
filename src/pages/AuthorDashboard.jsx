import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useSSE } from '../services/sse';
import { Navbar } from '../components/common/Navbar';
import { StatCard } from '../components/common/StatCard';
import { BookCard } from '../components/author/BookCard';
import { SubmitQueryModal } from '../components/author/SubmitQueryModal';
import { AuthorTicketThread } from '../components/author/AuthorTicketThread';
import { StatusBadge, CategoryBadge } from '../components/common/Badge';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import {
  BookOpen,
  DollarSign,
  Clock,
  CheckCircle,
  PlusCircle,
  MessageSquare,
  Inbox,
  RefreshCw,
  Trash2,
} from 'lucide-react';

export function AuthorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('books');
  const [books, setBooks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPreselectedBookId, setModalPreselectedBookId] = useState('general');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // SSE real-time stream
  const { isConnected } = useSSE({
    onTicketUpdate: (updatedTicket) => {
      if (!updatedTicket) return;
      setTickets((prev) =>
        prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t))
      );
    },
    onTicketDeleted: (deletedTicketId) => {
      setTickets((prev) => {
        const remaining = prev.filter((t) => t.id !== deletedTicketId);
        if (selectedTicketId === deletedTicketId) {
          setSelectedTicketId(remaining[0]?.id || null);
        }
        return remaining;
      });
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
    },
    onNewTicket: (newTicket) => {
      if (newTicket.authorId === (user?.author_id || user?.id)) {
        setTickets((prev) => {
          if (prev.some((t) => t.id === newTicket.id)) return prev;
          return [newTicket, ...prev];
        });
      }
    },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [booksRes, summaryRes, ticketsRes] = await Promise.all([
        api.authors.getBooks(),
        api.authors.getSummary(),
        api.tickets.getAll(),
      ]);

      setBooks(booksRes.books || []);
      setSummary(summaryRes.metrics || null);
      const fetchedTickets = ticketsRes.tickets || [];
      setTickets(fetchedTickets);

      if (fetchedTickets.length > 0 && !selectedTicketId) {
        setSelectedTicketId(fetchedTickets[0].id);
      }
    } catch (err) {
      console.error('Failed to load author data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleOpenModal = (bookId = 'general') => {
    setModalPreselectedBookId(bookId);
    setIsModalOpen(true);
  };

  const handleTicketCreated = (newTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setSelectedTicketId(newTicket.id);
    setActiveTab('tickets');
    setMobileShowThread(true);
  };

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
      if (mobileShowThread) {
        setMobileShowThread(false);
      }
      setTicketToDelete(null);
    } catch (err) {
      alert(err.message || 'Failed to delete ticket.');
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'All') return true;
    return t.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar isConnected={isConnected} />

      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '12px', width: '100%', boxSizing: 'border-box' }}>
        {/* Author Header Banner */}
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
                Welcome, {user?.name || 'Author'}!
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  padding: '2px 8px',
                  borderRadius: '16px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontWeight: '700',
                }}
              >
                Author Partner
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {user?.city ? `Based in ${user.city}` : 'BookLeaf Publishing Author Portal'} • Member since{' '}
              {user?.joined_date || '2023'}
            </p>
          </div>

          <button
            onClick={() => handleOpenModal('general')}
            className="btn btn-primary"
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            <PlusCircle size={15} />
            <span>Raise Support Ticket</span>
          </button>
        </div>

        {/* Financial & Publishing Metrics Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <StatCard
            title="Total Royalty Earned"
            value={`₹${summary?.totalRoyaltyEarned?.toLocaleString('en-IN') || 0}`}
            subtitle="80% net profit split"
            icon={DollarSign}
            accentColor="#10b981"
            badgeText="80/20 Net Profit"
          />

          <StatCard
            title="Royalty Paid"
            value={`₹${summary?.royaltyPaid?.toLocaleString('en-IN') || 0}`}
            subtitle="Via direct bank transfer"
            icon={CheckCircle}
            accentColor="#10b981"
          />

          <StatCard
            title="Royalty Pending"
            value={`₹${summary?.royaltyPending?.toLocaleString('en-IN') || 0}`}
            subtitle="Quarterly SLA (45 days)"
            icon={Clock}
            accentColor="#f59e0b"
            badgeText={summary?.royaltyPending >= 1000 ? 'Eligible' : '< ₹1,000 threshold'}
          />

          <StatCard
            title="Catalog & Sales"
            value={`${summary?.totalCopiesSold?.toLocaleString('en-IN') || 0} copies`}
            subtitle={`${summary?.totalBooks || books.length} titles (${summary?.inProductionCount || 0} in production)`}
            icon={BookOpen}
            accentColor="#3b82f6"
          />
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '20px',
            paddingBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setActiveTab('books');
                setMobileShowThread(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'books' ? 'var(--bg-card-hover)' : 'transparent',
                color: activeTab === 'books' ? '#10b981' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <BookOpen size={15} />
              <span>My Books ({books.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'tickets' ? 'var(--bg-card-hover)' : 'transparent',
                color: activeTab === 'tickets' ? '#10b981' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <MessageSquare size={15} />
              <span>My Tickets ({tickets.length})</span>
            </button>
          </div>

          <button
            onClick={fetchData}
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '11px' }}
            title="Refresh"
          >
            <RefreshCw size={13} />
            <span className="hide-on-small">Refresh</span>
          </button>
        </div>

        {/* Tab 1: My Books */}
        {activeTab === 'books' && (
          <div>
            {books.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '16px',
                }}
              >
                {books.map((book) => (
                  <BookCard
                    key={book.book_id}
                    book={book}
                    onRaiseTicket={(bookId) => handleOpenModal(bookId)}
                  />
                ))}
              </div>
            ) : (
              <div
                className="glass-panel"
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <BookOpen size={28} style={{ margin: '0 auto 8px' }} />
                <h3>No books found for this author</h3>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Support Tickets */}
        {activeTab === 'tickets' && (
          <div>
            {tickets.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: mobileShowThread ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '16px',
                  alignItems: 'start',
                }}
              >
                {/* Tickets Sidebar / List */}
                <div
                  className="glass-panel"
                  style={{
                    display: mobileShowThread && window.innerWidth < 768 ? 'none' : 'flex',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '14px',
                    maxHeight: '750px',
                    flexDirection: 'column',
                  }}
                >
                  {/* Status Filters */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {['All', 'Open', 'In Progress', 'Resolved'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          backgroundColor: statusFilter === st ? '#10b981' : 'var(--bg-primary)',
                          color: statusFilter === st ? '#ffffff' : 'var(--text-secondary)',
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* List */}
                  <div
                    style={{
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {filteredTickets.map((t) => {
                      const isSelected = t.id === selectedTicket?.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedTicketId(t.id);
                            setMobileShowThread(true);
                          }}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-primary)',
                            border: `1px solid ${isSelected ? '#059669' : 'var(--border-color)'}`,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '6px',
                            }}
                          >
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#10b981' }}>
                              {t.id}
                            </span>
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
                              fontWeight: '600',
                              color: 'var(--text-primary)',
                              marginBottom: '4px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {t.subject}
                          </div>

                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginBottom: '6px',
                            }}
                          >
                            {t.bookTitle || 'General Query'}
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
                  </div>
                </div>

                {/* Selected Ticket Thread */}
                <div style={{ minWidth: 0 }}>
                  {selectedTicket ? (
                    <AuthorTicketThread
                      ticket={selectedTicket}
                      onBackToList={() => setMobileShowThread(false)}
                      onDeleteTicket={handleDeleteClick}
                      onResponseAdded={(updatedTicket) => {
                        setTickets((prev) =>
                          prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
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
                      <Inbox size={28} style={{ margin: '0 auto 8px' }} />
                      <h3>Select a ticket from the left</h3>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="glass-panel"
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <MessageSquare size={32} color="#059669" style={{ margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  No support tickets raised yet
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '16px' }}>
                  Have questions regarding your book distribution, printing quality, ISBN, or royalties?
                </p>
                <button
                  onClick={() => handleOpenModal('general')}
                  className="btn btn-primary"
                >
                  <PlusCircle size={15} />
                  <span>Raise Your First Query</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <SubmitQueryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        books={books}
        preselectedBookId={modalPreselectedBookId}
        onTicketCreated={handleTicketCreated}
      />

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
