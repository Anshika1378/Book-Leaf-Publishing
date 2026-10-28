import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('bookleaf_token'));
  const [loading, setLoading] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState({ admins: [], authors: [] });

  // Load user on start
  useEffect(() => {
    async function initAuth() {
      try {
        // Fetch demo accounts for easy evaluator persona switching
        api.auth.getDemoAccounts()
          .then((res) => setDemoAccounts(res))
          .catch(() => {});

        if (token) {
          const res = await api.auth.me();
          setUser(res.user);
        }
      } catch (err) {
        console.warn('Session expired or invalid:', err.message);
        localStorage.removeItem('bookleaf_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    localStorage.setItem('bookleaf_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('bookleaf_token');
    setToken(null);
    setUser(null);
  };

  const switchPersona = async (email) => {
    setLoading(true);
    try {
      const res = await api.auth.login(email, 'BookLeaf@123');
      localStorage.setItem('bookleaf_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        switchPersona,
        demoAccounts,
        isAdmin: user?.role === 'admin',
        isAuthor: user?.role === 'author',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
