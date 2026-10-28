import React from 'react';

export function StatusBadge({ status }) {
  const norm = (status || 'Open').toLowerCase();
  let badgeClass = 'badge-open';
  let dotColor = '#fbbf24';

  if (norm.includes('progress')) {
    badgeClass = 'badge-progress';
    dotColor = '#60a5fa';
  } else if (norm.includes('resolve')) {
    badgeClass = 'badge-resolved';
    dotColor = '#34d399';
  } else if (norm.includes('close')) {
    badgeClass = 'badge-closed';
    dotColor = '#94a3b8';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: dotColor,
        }}
      />
      {status || 'Open'}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const norm = (priority || 'Medium').toLowerCase();
  let badgeClass = 'badge-medium';

  if (norm === 'critical') {
    badgeClass = 'badge-critical';
  } else if (norm === 'high') {
    badgeClass = 'badge-high';
  } else if (norm === 'low') {
    badgeClass = 'badge-low';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {priority === 'Critical' && '🔥 '}
      {priority === 'High' && '⚡ '}
      {priority}
    </span>
  );
}

export function CategoryBadge({ category }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '600',
        background: '#1e293b',
        color: '#cbd5e1',
        border: '1px solid #334155',
      }}
    >
      {category}
    </span>
  );
}
