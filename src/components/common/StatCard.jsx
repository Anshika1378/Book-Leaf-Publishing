import React from 'react';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor = '#10b981',
  badgeText,
}) {
  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '130px',
      }}
    >
      {/* Subtle background glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '80px',
          height: '80px',
          background: accentColor,
          opacity: 0.12,
          borderRadius: '50%',
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{title}</span>
        {Icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div>
        <div
          style={{
            fontSize: '26px',
            fontWeight: '800',
            color: 'var(--text-primary)',
            fontFamily: 'Outfit, sans-serif',
            lineHeight: 1.1,
            marginBottom: '4px',
          }}
        >
          {value}
        </div>
        {(subtitle || badgeText) && (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {badgeText && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: accentColor,
                  background: 'rgba(16, 185, 129, 0.12)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {badgeText}
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
