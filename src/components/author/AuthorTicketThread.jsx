import React, { useState } from 'react';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../common/Badge';
import { api } from '../../services/api';
import {
  Send,
  User,
  ShieldCheck,
  Clock,
  Book,
  Paperclip,
  Loader2,
  ArrowLeft,
  Trash2,
} from 'lucide-react';

export function AuthorTicketThread({ ticket, onResponseAdded, onBackToList, onDeleteTicket }) {
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');

  if (!ticket) return null;

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setIsSending(true);
    setSendError('');

    try {
      const res = await api.tickets.sendResponse(ticket.id, replyMessage.trim());
      setReplyMessage('');
      onResponseAdded?.(res.ticket, res.response);
    } catch (err) {
      setSendError(err.message || 'Failed to send reply. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '520px',
        maxHeight: '800px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Thread Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        {onBackToList && (
          <button
            onClick={onBackToList}
            className="btn btn-secondary hide-on-desktop"
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              marginBottom: '10px',
              display: 'inline-flex',
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Tickets</span>
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#10b981' }}>
              {ticket.id}
            </span>
            <span style={{ color: 'var(--border-color)' }}>•</span>
            <CategoryBadge category={ticket.category} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge status={ticket.status} />
            {onDeleteTicket && (
              <button
                type="button"
                onClick={() => onDeleteTicket(ticket.id)}
                className="btn btn-secondary"
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  color: '#ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
                title="Delete this ticket"
                aria-label="Delete ticket"
              >
                <Trash2 size={12} color="#ef4444" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>
          {ticket.subject}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Book size={13} />
            {ticket.bookTitle || 'General Query'}
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} />
            {new Date(ticket.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Messages Scrollable List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Original Query Message */}
        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  backgroundColor: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={14} color="#ffffff" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                You ({ticket.authorName})
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Query</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-primary)',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {ticket.description}
          </div>

          {ticket.attachments && ticket.attachments.length > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {ticket.attachments.map((att, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    fontSize: '11px',
                    color: '#3b82f6',
                  }}
                >
                  <Paperclip size={11} />
                  <span>{att.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Responses Thread */}
        {ticket.responses && ticket.responses.length > 0 ? (
          ticket.responses.map((resp) => {
            const isAdminSender = resp.senderRole === 'admin';
            return (
              <div
                key={resp.id}
                style={{
                  alignSelf: isAdminSender ? 'flex-start' : 'flex-end',
                  width: '92%',
                  maxWidth: '680px',
                  backgroundColor: isAdminSender
                    ? 'rgba(59, 130, 246, 0.08)'
                    : 'rgba(16, 185, 129, 0.08)',
                  border: `1px solid ${isAdminSender ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  borderRadius: '10px',
                  padding: '14px',
                  boxShadow: 'var(--shadow-panel)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        backgroundColor: isAdminSender ? '#3b82f6' : '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                      }}
                    >
                      {isAdminSender ? <ShieldCheck size={14} /> : <User size={14} />}
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {resp.senderName}
                      </span>
                      {isAdminSender && (
                        <span
                          style={{
                            marginLeft: '6px',
                            fontSize: '10px',
                            fontWeight: '700',
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            color: '#3b82f6',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          BookLeaf Official
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(resp.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {resp.message}
                </div>
              </div>
            );
          })
        ) : (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '8px',
              border: '1px dashed var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
            }}
          >
            <Clock size={18} color="#f59e0b" style={{ margin: '0 auto 6px' }} />
            <div>Your query is with our Author Success team.</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Replies appear here in real time without refreshing.
            </div>
          </div>
        )}
      </div>

      {/* Reply Input Box */}
      {ticket.status !== 'Closed' ? (
        <form
          onSubmit={handleSendReply}
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {sendError && (
            <div style={{ fontSize: '12px', color: '#ef4444' }}>{sendError}</div>
          )}

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea
              rows={2}
              placeholder="Reply to BookLeaf Support..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              className="glass-input"
              style={{ resize: 'none', flex: 1, fontSize: '13px' }}
              disabled={isSending}
            />

            <button
              type="submit"
              disabled={isSending || !replyMessage.trim()}
              className="btn btn-primary"
              style={{ padding: '8px 14px', height: '40px' }}
            >
              {isSending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  <Send size={14} />
                  <span className="hide-on-small">Send</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div
          style={{
            padding: '10px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-card)',
            borderTop: '1px solid var(--border-color)',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          Ticket closed. Please submit a new ticket for new queries.
        </div>
      )}
    </div>
  );
}
