import React, { useState, useEffect } from 'react';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../common/Badge';
import { api } from '../../services/api';
import {
  Sparkles,
  Send,
  Lock,
  User,
  Book,
  Clock,
  Paperclip,
  Check,
  Loader2,
  ArrowLeft,
  Trash2,
} from 'lucide-react';

const CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
];

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export function TicketDetailDrawer({ ticket, onTicketUpdated, onResponseSent, onBackToQueue, onDeleteTicket }) {
  const [replyMessage, setReplyMessage] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isRegeneratingDraft, setIsRegeneratingDraft] = useState(false);
  const [activeTone, setActiveTone] = useState('standard');
  const [currentDraft, setCurrentDraft] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (ticket) {
      setCurrentDraft(ticket.aiDraftResponse || '');
      setReplyMessage(ticket.aiDraftResponse || '');
      setStatusMessage('');
    }
  }, [ticket?.id]);

  if (!ticket) return null;

  const handleCategoryChange = async (newCategory) => {
    try {
      const res = await api.tickets.update(ticket.id, { category: newCategory });
      onTicketUpdated?.(res.ticket);
      setStatusMessage(`Category: ${newCategory}`);
      setTimeout(() => setStatusMessage(''), 2500);
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      const res = await api.tickets.update(ticket.id, { priority: newPriority });
      onTicketUpdated?.(res.ticket);
      setStatusMessage(`Priority: ${newPriority}`);
      setTimeout(() => setStatusMessage(''), 2500);
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await api.tickets.update(ticket.id, { status: newStatus });
      onTicketUpdated?.(res.ticket);
      setStatusMessage(`Status: ${newStatus}`);
      setTimeout(() => setStatusMessage(''), 2500);
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleAssigneeChange = async (assignedTo) => {
    try {
      const res = await api.tickets.update(ticket.id, { assignedTo });
      onTicketUpdated?.(res.ticket);
      setStatusMessage(`Assigned`);
      setTimeout(() => setStatusMessage(''), 2500);
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleRegenerateDraft = async (tone = activeTone) => {
    setActiveTone(tone);
    setIsRegeneratingDraft(true);
    try {
      const res = await api.ai.generateDraft(ticket.id, tone);
      setCurrentDraft(res.draft);
      setReplyMessage(res.draft);
      setStatusMessage(`Draft: ${tone}`);
      setTimeout(() => setStatusMessage(''), 2500);
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setIsRegeneratingDraft(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
      const res = await api.tickets.sendResponse(ticket.id, replyMessage.trim());
      onResponseSent?.(res.ticket, res.response);
      setStatusMessage('Response sent to author');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      alert('Failed to send response: ' + err.message);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleAddInternalNote = async (e) => {
    e.preventDefault();
    if (!internalNoteText.trim()) return;

    setIsAddingNote(true);
    try {
      const res = await api.tickets.addInternalNote(ticket.id, internalNoteText.trim());
      setInternalNoteText('');
      onTicketUpdated?.(res.ticket);
      setStatusMessage('Internal note saved');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setIsAddingNote(false);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '900px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        {onBackToQueue && (
          <button
            onClick={onBackToQueue}
            className="btn btn-secondary hide-on-desktop"
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              marginBottom: '10px',
              display: 'inline-flex',
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Queue</span>
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#10b981' }}>
              {ticket.id}
            </span>
            <span style={{ color: 'var(--border-color)' }}>•</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Author: <strong style={{ color: 'var(--text-primary)' }}>{ticket.authorName}</strong> ({ticket.authorEmail})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {statusMessage && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                ✓ {statusMessage}
              </span>
            )}
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

        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>
          {ticket.subject}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Book size={13} />
            Book: <strong style={{ color: 'var(--text-primary)' }}>{ticket.bookTitle || 'General / None'}</strong>
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} />
            {new Date(ticket.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main Scrollable Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* Author Query Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={13} color="#ffffff" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {ticket.authorName}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Original Query</span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {ticket.description}
          </p>

          {ticket.attachments && ticket.attachments.length > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {ticket.attachments.map((att, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 6px',
                    borderRadius: '4px',
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

        {/* AI Auto-Triage & Classification Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '10px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={14} color="#ffffff" />
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  AI Auto-Triage Engine
                </span>
                <span style={{ fontSize: '10px', color: '#8b5cf6', marginLeft: '6px' }}>
                  ({Math.round((ticket.aiClassification?.confidence || 0.95) * 100)}% match)
                </span>
              </div>
            </div>

            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Overrides enabled
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Classification Category
              </label>
              <select
                value={ticket.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="glass-input"
                style={{ fontSize: '12px', padding: '6px 8px', cursor: 'pointer' }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Priority Score
              </label>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="glass-input"
                style={{ fontSize: '12px', padding: '6px 8px', cursor: 'pointer' }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p} {p === 'Critical' ? '🔥' : p === 'High' ? '⚡' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {ticket.aiClassification?.reasoning && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-primary)', padding: '6px 10px', borderRadius: '6px' }}>
              <strong style={{ color: '#6366f1' }}>AI Logic: </strong>
              {ticket.aiClassification.reasoning}
            </div>
          )}
        </div>

        {/* Existing Responses in Thread */}
        {ticket.responses && ticket.responses.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Thread History ({ticket.responses.length})
            </div>
            {ticket.responses.map((resp) => {
              const isAdmin = resp.senderRole === 'admin';
              return (
                <div
                  key={resp.id}
                  style={{
                    backgroundColor: isAdmin ? 'rgba(59, 130, 246, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                    border: `1px solid ${isAdmin ? 'rgba(59, 130, 246, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {resp.senderName}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: isAdmin ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: isAdmin ? '#3b82f6' : '#10b981',
                        }}
                      >
                        {isAdmin ? 'BookLeaf Team' : 'Author'}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {new Date(resp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {resp.message}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* AI-Drafted Response & Tone Assistant */}
        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '10px',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={15} color="#3b82f6" />
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Knowledge Base AI Draft
              </span>
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {['standard', 'empathetic', 'concise', 'formal'].map((tone) => (
                <button
                  key={tone}
                  onClick={() => handleRegenerateDraft(tone)}
                  disabled={isRegeneratingDraft}
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '3px 7px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    backgroundColor: activeTone === tone ? '#2563eb' : 'var(--bg-secondary)',
                    color: activeTone === tone ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-secondary)',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              maxHeight: '180px',
              overflowY: 'auto',
              marginBottom: '10px',
            }}
          >
            {isRegeneratingDraft ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
                <Loader2 size={14} className="animate-spin" />
                <span>Generating draft...</span>
              </div>
            ) : (
              currentDraft || 'No draft generated.'
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Reflects BookLeaf 80/20 royalty & Delhi printing policies.
            </span>

            <button
              type="button"
              onClick={() => setReplyMessage(currentDraft)}
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              <Check size={13} color="#10b981" />
              <span>Copy to Editor</span>
            </button>
          </div>
        </div>

        {/* Response Composer Form */}
        <form onSubmit={handleSendReply} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Official Response to Author
            </label>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Live real-time delivery
            </span>
          </div>

          <textarea
            rows={4}
            placeholder="Edit or compose your response..."
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            className="glass-input"
            style={{ fontSize: '13px', lineHeight: 1.6 }}
            required
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="submit"
              disabled={isSendingReply || !replyMessage.trim()}
              className="btn btn-primary"
              style={{ padding: '7px 14px', fontSize: '13px' }}
            >
              {isSendingReply ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Send Response to Author</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Confidential Internal Notes */}
        <div
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '10px',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} color="#f59e0b" />
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#f59e0b' }}>
                Confidential Internal Notes
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                (Hidden from author)
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {ticket.internalNotes?.length || 0}
            </span>
          </div>

          {ticket.internalNotes && ticket.internalNotes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              {ticket.internalNotes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontWeight: '700', color: '#f59e0b' }}>{note.authorName}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>{note.content}</div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddInternalNote} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Add confidential team note..."
              value={internalNoteText}
              onChange={(e) => setInternalNoteText(e.target.value)}
              className="glass-input"
              style={{ fontSize: '12px', flex: 1, padding: '7px 10px' }}
            />
            <button
              type="submit"
              disabled={isAddingNote || !internalNoteText.trim()}
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '6px 12px' }}
            >
              {isAddingNote ? 'Saving...' : 'Add Note'}
            </button>
          </form>
        </div>
      </div>

      {/* Footer Management Controls */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
            Assign:
          </span>
          <select
            value={ticket.assignedTo || ''}
            onChange={(e) => handleAssigneeChange(e.target.value || null)}
            className="glass-input"
            style={{ width: 'auto', minWidth: '160px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
          >
            <option value="">Unassigned</option>
            <option value="admin@bookleaf.in">Ops Lead (admin@bookleaf.in)</option>
            <option value="support@bookleafpub.com">Royalty Desk (support@bookleafpub.com)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
            Status:
          </span>
          {STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => handleStatusChange(st)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: ticket.status === st ? '#10b981' : 'var(--bg-primary)',
                color: ticket.status === st ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
