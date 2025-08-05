'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback, useEffect } from 'react';

export type User = {
  name: string;
  email: string;
  role: 'admin' | 'employee';
};

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((userData: User) => {
    setLoading(true);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    setLoading(true);
    setUser(null);
    localStorage.removeItem('user');
    setLoading(false);
  }, []);

  const authContextValue = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated: user !== null,
      loading,
    }),
    [user, login, logout, loading]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}
