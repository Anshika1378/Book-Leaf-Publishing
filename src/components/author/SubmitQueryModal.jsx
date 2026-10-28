import React, { useState } from 'react';
import { api } from '../../services/api';
import { X, Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';

export function SubmitQueryModal({ isOpen, onClose, books = [], preselectedBookId = '', onTicketCreated }) {
  const [selectedBookId, setSelectedBookId] = useState(preselectedBookId || 'general');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSimulateFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type || 'document',
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please provide both a subject and a detailed description.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const res = await api.tickets.create({
        bookId: selectedBookId === 'general' ? null : selectedBookId,
        subject: subject.trim(),
        description: description.trim(),
        attachments,
      });

      onTicketCreated?.(res.ticket);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit support query. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '92vh',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-panel)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Submit a Support Query
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Our operations team will review and respond promptly.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '10px 12px',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '13px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Book Dropdown */}
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '4px',
              }}
            >
              Which book is this query regarding?
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="glass-input"
              style={{ width: '100%', cursor: 'pointer', fontSize: '13px' }}
            >
              <option value="general">General / Account Level (Not book-specific)</option>
              {books.map((b) => (
                <option key={b.book_id} value={b.book_id}>
                  {b.title} {b.isbn ? `(${b.isbn})` : `(${b.status})`}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Line */}
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '4px',
              }}
            >
              Subject Line
            </label>
            <input
              type="text"
              placeholder="e.g. Question about quarterly royalty payout"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '4px',
              }}
            >
              Detailed Description
            </label>
            <textarea
              rows={4}
              placeholder="Please provide all details so our team can assist you without back-and-forth delays..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input"
              style={{ resize: 'vertical', fontSize: '13px' }}
              required
            />
          </div>

          {/* Attachments UI */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '4px',
              }}
            >
              Optional Attachments (defect photos, screenshots)
            </label>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px',
                border: '2px dashed var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-primary)',
                transition: 'all 0.2s',
              }}
            >
              <Upload size={18} color="#10b981" style={{ marginBottom: '4px' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Click to attach photos or files
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                PNG, JPG, PDF up to 10MB
              </span>
              <input
                type="file"
                multiple
                onChange={handleSimulateFileUpload}
                style={{ display: 'none' }}
              />
            </label>

            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={13} color="#10b981" />
                      <span style={{ color: 'var(--text-primary)' }}>{file.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>({file.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(file.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Ticket</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
