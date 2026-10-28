import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  BookOpen,
  Shield,
  User,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

export function Navbar({ isConnected = true }) {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header
      style={{
        backgroundColor: 'var(--header-bg)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(8px)',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        {/* Brand (Left) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(5, 150, 105, 0.35)',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <BookOpen size={18} color="#ffffff" />
            {/* Embedded Live Pulse dot on logo */}
            <span
              title={isConnected ? 'Real-Time Live' : 'Connecting...'}
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10b981' : '#f59e0b',
                border: '2px solid var(--header-bg)',
                boxShadow: isConnected ? '0 0 6px #10b981' : 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '17px',
                  fontWeight: '800',
                  color: 'var(--text-primary)',
                  fontFamily: 'Outfit, sans-serif',
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                BookLeaf
              </span>
              <span
                className="hide-on-small"
                style={{
                  fontSize: '9px',
                  fontWeight: '700',
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.15)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  whiteSpace: 'nowrap',
                }}
              >
                PUBLISHING
              </span>
            </div>
            <div
              className="hide-on-mobile"
              style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}
            >
              {isAdmin ? 'Operations & Author Support Desk' : 'Author Self-Publishing Portal'}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Live Sync Badge - Desktop only */}
          <div
            className="hide-on-mobile"
            title={isConnected ? 'Real-Time SSE Connected' : 'Connecting to Real-Time stream...'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: isConnected ? '#10b981' : '#f59e0b',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '5px 9px',
              borderRadius: '20px',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10b981' : '#f59e0b',
                boxShadow: isConnected ? '0 0 6px #10b981' : 'none',
              }}
            />
            <span>{isConnected ? 'Live Sync' : 'Connecting'}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn-theme-toggle"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
            style={{ width: '32px', height: '32px', padding: 0 }}
          >
            {isDark ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#3b82f6" />}
          </button>

          {/* User Badge with Role */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              height: '34px',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                backgroundColor: isAdmin ? '#6366f1' : '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '12px',
                flexShrink: 0,
              }}
            >
              {isAdmin ? <Shield size={13} /> : <User size={13} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '10px', color: isAdmin ? '#818cf8' : '#10b981', fontWeight: '600' }}>
                {isAdmin ? 'Admin' : 'Author'}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{
              height: '34px',
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
            }}
            title="Sign out of your account"
            aria-label="Logout"
          >
            <LogOut size={14} color="#ef4444" />
            <span className="hide-on-mobile">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
