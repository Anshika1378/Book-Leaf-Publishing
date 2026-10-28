import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  BookOpen,
  Shield,
  User,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  FileText,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('BookLeaf@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentialsHelper, setShowCredentialsHelper] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Invalid login credentials. Verify email or check password: BookLeaf@123');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillCredentials = (fillEmail) => {
    setEmail(fillEmail);
    setPassword('BookLeaf@123');
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Floating Theme Toggle */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 20,
        }}
      >
        <button
          onClick={toggleTheme}
          className="btn-theme-toggle"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#3b82f6" />}
        </button>
      </div>

      {/* Decorative ambient background glows */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '20%',
          width: '340px',
          height: '340px',
          background: 'rgba(5, 150, 105, 0.12)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '20%',
          width: '340px',
          height: '340px',
          background: 'rgba(99, 102, 241, 0.1)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      {/* Centered Login Card */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '36px 32px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-panel)',
          zIndex: 10,
          position: 'relative',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(5, 150, 105, 0.35)',
              marginBottom: '14px',
            }}
          >
            <BookOpen size={28} color="#ffffff" />
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              fontFamily: 'Outfit, sans-serif',
              letterSpacing: '-0.02em',
              marginBottom: '4px',
            }}
          >
            BookLeaf Publishing
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Author Self-Publishing & Operations Portal
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '10px 14px',
              borderRadius: '10px',
              color: '#ef4444',
              fontSize: '13px',
              marginBottom: '18px',
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="login-email"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="e.g. priya.sharma@email.com or admin@bookleaf.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input"
              autoComplete="email"
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label
                htmlFor="login-password"
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                }}
              >
                Password
              </label>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Default: <strong style={{ color: '#10b981' }}>BookLeaf@123</strong>
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input"
                autoComplete="current-password"
                required
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 14px',
                  fontSize: '14px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              marginTop: '8px',
              padding: '12px',
              width: '100%',
              fontSize: '15px',
              fontWeight: '700',
              borderRadius: '10px',
            }}
          >
            {isLoading ? 'Signing In to Account...' : 'Sign In to Portal'}
          </button>
        </form>

        {/* Security & Access Info */}
        <div
          style={{
            marginTop: '20px',
            padding: '10px 12px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          🔒 Role-Based Access: Log in as an Author to view your books & royalties, or as Admin for operations triage.
        </div>

        {/* Collapsible Credentials Helper */}
        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => setShowCredentialsHelper(!showCredentialsHelper)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <KeyRound size={13} color="#10b981" />
            <span>Test Accounts & Credentials Helper</span>
            {showCredentialsHelper ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showCredentialsHelper && (
            <div
              style={{
                marginTop: '10px',
                padding: '12px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={12} />
                OPERATIONS ADMIN
              </div>
              <button
                type="button"
                onClick={() => handleFillCredentials('admin@bookleaf.in')}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '11px',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  textAlign: 'left',
                }}
              >
                <span><strong>BookLeaf Ops Lead:</strong> admin@bookleaf.in</span>
                <span style={{ fontSize: '10px', color: '#818cf8' }}>Fill Form</span>
              </button>

              <div style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={12} />
                AUTHOR ACCOUNTS (10 AUTHORS PRE-SEEDED)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { name: 'Priya Sharma', email: 'priya.sharma@email.com', info: '2 Books • ₹3,570 Pending Royalty' },
                  { name: 'Rohit Kapoor', email: 'rohit.kapoor@email.com', info: '2 Books • ₹7,744 Pending Royalty' },
                  { name: 'Sneha Kulkarni', email: 'sneha.kulkarni@email.com', info: 'In-Production • Jaipur' },
                  { name: 'Ananya Reddy', email: 'ananya.reddy@email.com', info: '1 Book • Hyderabad' },
                ].map((item) => (
                  <button
                    key={item.email}
                    type="button"
                    onClick={() => handleFillCredentials(item.email)}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: '11px',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div><strong>{item.name}:</strong> {item.email}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.info}</div>
                    </div>
                    <span style={{ fontSize: '10px', color: '#10b981' }}>Fill</span>
                  </button>
                ))}
              </div>

              <div
                style={{
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                }}
              >
                <FileText size={12} color="#10b981" />
                <span>All 10 author credentials documented in <code>AUTHORS_CREDENTIALS.md</code></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
