
'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export type User = {
  uid: string;
  name: string | null;
  email: string | null;
  role: 'admin' | 'employee';
  isProfileComplete: boolean;
  lastLocation?: {
    latitude: number,
    longitude: number
  };
  locationSettings?: {
    latitude: number;
    longitude: number;
    radius: number;
  } | null;
  faceprint?: string | null;
  department?: string | null;
  employeeId?: string | null;
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
      const role = userData.role || (fbUser.email?.toLowerCase().includes('admin') ? 'admin' : 'employee');
      
      let locationSettings = null;
      if (userData.locationSettings && 
          userData.locationSettings.latitude != null && 
          userData.locationSettings.longitude != null && 
          userData.locationSettings.radius != null) {
          locationSettings = {
              latitude: Number(userData.locationSettings.latitude),
              longitude: Number(userData.locationSettings.longitude),
              radius: Number(userData.locationSettings.radius),
          };
      }

      return {
        uid: fbUser.uid,
        name: userData.name || fbUser.displayName,
        email: fbUser.email,
        role: role,
        isProfileComplete: userData.isProfileComplete || false,
        lastLocation: userData.lastLocation || null,
        locationSettings: locationSettings,
        faceprint: userData.faceprint || null,
        department: userData.department || null,
        employeeId: userData.employeeId || null,
      };
    }
     console.warn(`No user document found for UID: ${fbUser.uid}. This might be a new user.`);
    const role = fbUser.email?.toLowerCase().includes('admin') ? 'admin' : 'employee';
    return {
      uid: fbUser.uid,
      name: fbUser.displayName,
      email: fbUser.email,
      role: role,
      isProfileComplete: role === 'admin',
      faceprint: null,
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

  const checkUserStatus = useCallback(async () => {
    setLoading(true);
    const fbUser = auth.currentUser;
    if (fbUser) {
        const appUser = await fetchUserData(fbUser);
        setUser(appUser);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
          setUser(null);
          setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (firebaseUser) {
        setLoading(true);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                const role = userData.role || (firebaseUser.email?.toLowerCase().includes('admin') ? 'admin' : 'employee');
                
                let locationSettings = null;
                if (userData.locationSettings && 
                    userData.locationSettings.latitude != null && 
                    userData.locationSettings.longitude != null && 
                    userData.locationSettings.radius != null) {
                    locationSettings = {
                        latitude: Number(userData.locationSettings.latitude),
                        longitude: Number(userData.locationSettings.longitude),
                        radius: Number(userData.locationSettings.radius),
                    };
                }

                setUser({
                    uid: firebaseUser.uid,
                    name: userData.name || firebaseUser.displayName,
                    email: firebaseUser.email,
                    role: role,
                    isProfileComplete: userData.isProfileComplete || false,
                    lastLocation: userData.lastLocation || null,
                    locationSettings: locationSettings,
                    faceprint: userData.faceprint || null,
                    department: userData.department || null,
                    employeeId: userData.employeeId || null,
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error listening to user document:", error);
            setLoading(false);
        });

        return () => unsubscribeUser();
    } else {
        setLoading(false);
    }
}, [firebaseUser]);


  const login = useCallback(async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  }, []);

  const register = useCallback(async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = userCredential.user;
    
    await updateProfile(fbUser, { displayName: name });
    
    const role = email.toLowerCase().includes('admin') ? 'employee' : 'employee';

    const isProfileComplete = role === 'admin';

    const userRef = doc(db, "users", fbUser.uid);
    await setDoc(userRef, {
      uid: fbUser.uid,
      name: name,
      email: email,
      role: role,
      isProfileComplete: isProfileComplete, 
      createdAt: new Date(),
      faceprint: null, // Initialize faceprint as null
    });
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const authContextValue = useMemo(
    () => ({
      user,
      firebaseUser,
      login,
      register,
      logout,
      isAuthenticated: !!user && !!firebaseUser, // Ensure both are present
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

    