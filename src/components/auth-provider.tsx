'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export type User = {
  uid: string;
  name: string | null;
  email: string | null;
  role: 'admin' | 'employee';
};

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const userRef = doc(db, 'users', fbUser.uid);
        getDoc(userRef).then(userDoc => {
            if (userDoc.exists()) {
                const userData = userDoc.data();
                 const appUser: User = {
                    uid: fbUser.uid,
                    name: fbUser.displayName,
                    email: fbUser.email,
                    role: userData.role || 'employee',
                };
                setUser(appUser);
                localStorage.setItem('user', JSON.stringify(appUser));
            }
        });
      } else {
        setFirebaseUser(null);
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, pass);
    setLoading(false);
  }, []);

  const register = useCallback(async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;
      
      await updateProfile(fbUser, { displayName: name });

      // All new users are registered as 'employee' by default.
      // To make a user an admin, you must manually change their role in the Firestore database.
      const role = 'employee';

      const userRef = doc(db, "users", fbUser.uid);
      await setDoc(userRef, {
        uid: fbUser.uid,
        name: name,
        email: email,
        role: role,
        createdAt: new Date(),
      });

    } catch (error) {
        console.error("Error during registration:", error);
        throw error;
    } finally {
        setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    await signOut(auth);
    setLoading(false);
  }, []);

  const authContextValue = useMemo(
    () => ({
      user,
      firebaseUser,
      login,
      register,
      logout,
      isAuthenticated: user !== null,
      loading,
    }),
    [user, firebaseUser, login, register, logout, loading]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}
