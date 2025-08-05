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
  isProfileComplete: boolean;
};

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  checkUserStatus: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const fetchUserData = async (fbUser: FirebaseUser): Promise<User | null> => {
  try {
    const userDocRef = doc(db, 'users', fbUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        uid: fbUser.uid,
        name: fbUser.displayName,
        email: fbUser.email,
        role: userData.role || 'employee',
        isProfileComplete: userData.isProfileComplete || false,
      };
    }
     console.warn(`No user document found for UID: ${fbUser.uid}. This might be a new user.`);
    // This can happen for a brand new user right after registration before the doc is created.
    // Let's create a default user object based on registration info.
    const role = fbUser.email?.toLowerCase().includes('admin') ? 'admin' : 'employee';
    return {
      uid: fbUser.uid,
      name: fbUser.displayName,
      email: fbUser.email,
      role: role,
      isProfileComplete: role === 'admin', // Admins are complete by default
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUserState = useCallback(async (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      setFirebaseUser(fbUser);
      const appUser = await fetchUserData(fbUser);
      setUser(appUser);
    } else {
      setFirebaseUser(null);
      setUser(null);
    }
    setLoading(false);
  }, []);

  const checkUserStatus = useCallback(async () => {
    // This function will re-fetch user data if needed.
    // It's useful after manual profile updates.
    const fbUser = auth.currentUser;
    setLoading(true);
    await updateUserState(fbUser);
    setLoading(false);
  }, [updateUserState]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, updateUserState);
    return () => unsubscribe();
  }, [updateUserState]);

  const login = useCallback(async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    // onAuthStateChanged will handle updating the state by calling updateUserState
  }, []);

  const register = useCallback(async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = userCredential.user;
    
    await updateProfile(fbUser, { displayName: name });
    
    const role = email.toLowerCase().includes('admin') ? 'admin' : 'employee';

    // For admins, their profile is complete by default.
    const isProfileComplete = role === 'admin';

    const userRef = doc(db, "users", fbUser.uid);
    await setDoc(userRef, {
      uid: fbUser.uid,
      name: name,
      email: email,
      role: role,
      isProfileComplete: isProfileComplete, 
      createdAt: new Date(),
    });
    // onAuthStateChanged will handle the rest
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    // onAuthStateChanged will clear the state
  }, []);

  const authContextValue = useMemo(
    () => ({
      user,
      firebaseUser,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      loading,
      checkUserStatus
    }),
    [user, firebaseUser, login, register, logout, loading, checkUserStatus]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}
