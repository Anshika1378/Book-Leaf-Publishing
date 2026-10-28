import React from 'react';
import {
  Book,
  Printer,
  MessageSquarePlus,
} from 'lucide-react';

const PRODUCTION_STAGES = [
  'Manuscript Received',
  'Editing',
  'Cover Design',
  'Typesetting',
  'Proofreading',
  'ISBN Assignment',
  'Printing',
  'Distribution Setup',
  'Published & Live',
];

export function BookCard({ book, onRaiseTicket }) {
  const isInProduction = book.status && book.status.toLowerCase().includes('in production');

  let currentStageIndex = 8;
  if (isInProduction) {
    if (book.status.toLowerCase().includes('cover design')) currentStageIndex = 2;
    else if (book.status.toLowerCase().includes('typeset')) currentStageIndex = 3;
    else if (book.status.toLowerCase().includes('proofread')) currentStageIndex = 4;
    else if (book.status.toLowerCase().includes('editing')) currentStageIndex = 1;
    else currentStageIndex = 0;
  }

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Top Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {book.genre || 'General Fiction'}
              </span>
              <span style={{ color: 'var(--border-color)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {book.book_id}
              </span>
            </div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                lineHeight: 1.3,
                marginBottom: '4px',
              }}
            >
              {book.title}
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>ISBN:</span>
              <code
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  color: book.isbn ? 'var(--text-primary)' : '#f59e0b',
                  fontSize: '11px',
                  border: '1px solid var(--border-color)',
                }}
              >
                {book.isbn || 'Pending Assignment'}
              </code>
            </div>
          </div>

          <span
            className="badge"
            style={{
              backgroundColor: isInProduction ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: isInProduction ? '#f59e0b' : '#10b981',
              border: `1px solid ${isInProduction ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              fontSize: '11px',
            }}
          >
            {book.status}
          </span>
        </div>

        {/* In Production Visual Stepper */}
        {isInProduction ? (
          <div
            style={{
              marginTop: '16px',
              padding: '14px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#f59e0b' }}>
                Active Production Pipeline
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Step {currentStageIndex + 1} of 9
              </span>
            </div>
            <div
              style={{
                height: '6px',
                backgroundColor: 'var(--border-color)',
                borderRadius: '3px',
                overflow: 'hidden',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${((currentStageIndex + 1) / 9) * 100}%`,
                  background: 'linear-gradient(90deg, #f59e0b, #10b981)',
                  borderRadius: '3px',
                }}
              />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
              Currently in: <strong style={{ color: 'var(--text-primary)' }}>{PRODUCTION_STAGES[currentStageIndex]}</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Estimated next milestone in 3–5 business days.
              </div>
            </div>
          </div>
        ) : (
          /* Live Book Royalty & Sales Grid (Responsive) */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '10px',
              marginTop: '16px',
              padding: '12px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MRP / Royalty</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                ₹{book.mrp || 0}
                <span style={{ fontSize: '10px', color: '#10b981', marginLeft: '3px' }}>
                  (₹{book.author_royalty_per_copy || 0})
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Copies Sold</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {book.total_copies_sold?.toLocaleString('en-IN') || 0}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Royalty Paid</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>
                ₹{book.royalty_paid?.toLocaleString('en-IN') || 0}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pending</div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: book.royalty_pending > 0 ? '#f59e0b' : 'var(--text-muted)',
                }}
              >
                ₹{book.royalty_pending?.toLocaleString('en-IN') || 0}
              </div>
            </div>
          </div>
        )}

        {/* Distribution Channels & Print Partner */}
        <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
          {book.print_partner && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Printer size={11} />
              Print: {book.print_partner}
            </span>
          )}

          {book.available_on && book.available_on.length > 0 ? (
            book.available_on.map((channel) => (
              <span
                key={channel}
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                }}
              >
                {channel}
              </span>
            ))
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Channels: Pending publication
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div
        style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {book.publication_date
            ? `Published ${book.publication_date}`
            : 'Pending launch'}
        </div>

        <button
          onClick={() => onRaiseTicket(book.book_id)}
          className="btn btn-secondary"
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          <MessageSquarePlus size={13} color="#10b981" />
          <span>Raise Query for Book</span>
        </button>
      </div>
    </div>
  );
}
