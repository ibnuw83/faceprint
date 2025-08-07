
import { useContext } from 'react';
import { AuthContext } from '@/components/auth-provider';
import type { User } from '@/components/auth-provider';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export type { User };
