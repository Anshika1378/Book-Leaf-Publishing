import React from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { AuthorDashboard } from './pages/AuthorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { user, loading, isAdmin, isAuthor } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0a0f1d',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <Loader2 size={36} color="#10b981" className="animate-spin" />
        <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
          Loading BookLeaf Publishing Portal...
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return <AuthorDashboard />;
}
