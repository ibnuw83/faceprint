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

const fetchUserRole = async (uid: string): Promise<'admin' | 'employee'> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.data()?.role || 'employee';
    }
    console.warn(`No user document found for UID: ${uid}. Defaulting to 'employee'.`);
    return 'employee';
  } catch (error) {
    console.error("Error fetching user role:", error);
    return 'employee';
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUserState = useCallback(async (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      setFirebaseUser(fbUser);
      const role = await fetchUserRole(fbUser.uid);
      const appUser: User = {
        uid: fbUser.uid,
        name: fbUser.displayName,
        email: fbUser.email,
        role: role,
      };
      setUser(appUser);
    } else {
      setFirebaseUser(null);
      setUser(null);
    }
    setLoading(false);
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, updateUserState);
    return () => unsubscribe();
  }, [updateUserState]);

  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    await updateUserState(userCredential.user);
    // setLoading is handled by updateUserState
  }, [updateUserState]);

  const register = useCallback(async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;
      
      await updateProfile(fbUser, { displayName: name });
      
      // Default role is 'employee'. If registering 'admin@visageid.com', set role to 'admin'.
      const role = email.toLowerCase() === 'admin@visageid.com' ? 'admin' : 'employee';

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
    setUser(null);
    setFirebaseUser(null);
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
