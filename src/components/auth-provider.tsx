
'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback, useEffect, useContext } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { ToastProps } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

type Schedule = Record<string, { clockIn: string; clockOut: string }>;

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
    name?: string;
  } | null;
  faceprint?: string | null;
  department?: string | null;
  employeeId?: string | null;
  schedule?: Schedule;
};

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, pass: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  register: (email: string, pass: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
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
      
      let locationSettings = null;
      const rawSettings = userData.locationSettings;
      if (rawSettings) {
        const lat = Number(rawSettings.latitude);
        const lng = Number(rawSettings.longitude);
        const radius = Number(rawSettings.radius);

        if (!isNaN(lat) && !isNaN(lng) && !isNaN(radius)) {
            locationSettings = {
                latitude: lat,
                longitude: lng,
                radius: radius,
                name: rawSettings.name || undefined,
            };
        }
      }

      return {
        uid: fbUser.uid,
        name: userData.name || fbUser.displayName,
        email: fbUser.email,
        role: userData.role,
        isProfileComplete: userData.isProfileComplete || false,
        lastLocation: userData.lastLocation || null,
        locationSettings: locationSettings,
        faceprint: userData.faceprint || null,
        department: userData.department || null,
        employeeId: userData.employeeId || null,
        schedule: userData.schedule || null,
      };
    }
    console.warn(`No user document found for UID: ${fbUser.uid}.`);
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  }, []);

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
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        const userDocRef = doc(db, 'users', fbUser.uid);
        
        const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            let locationSettings = null;
            const rawSettings = userData.locationSettings;
             if (rawSettings && rawSettings.latitude && rawSettings.longitude && rawSettings.radius) {
                const lat = Number(rawSettings.latitude);
                const lng = Number(rawSettings.longitude);
                const radius = Number(rawSettings.radius);
                if (!isNaN(lat) && !isNaN(lng) && !isNaN(radius)) {
                    locationSettings = {
                        latitude: lat,
                        longitude: lng,
                        radius: radius,
                        name: rawSettings.name || undefined,
                    };
                }
            }

            setUser({
                uid: fbUser.uid,
                name: userData.name || fbUser.displayName,
                email: fbUser.email,
                role: userData.role,
                isProfileComplete: userData.isProfileComplete || false,
                lastLocation: userData.lastLocation || null,
                locationSettings: locationSettings,
                faceprint: userData.faceprint || null,
                department: userData.department || null,
                employeeId: userData.employeeId || null,
                schedule: userData.schedule || null,
            });
          } else {
             console.log("User document disappeared. User might have been deleted.");
             logout();
          }
          setLoading(false);
        }, (error) => {
            console.error("Error listening to user document:", error);
            setLoading(false);
            logout();
        });

        return () => unsubscribeUser();
      } else {
        setFirebaseUser(null);
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [logout]);


  const login = useCallback(async (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;
    
    const userRef = doc(db, 'users', fbUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // If user doesn't exist in Firestore, create a new profile
       const role = fbUser.email?.toLowerCase().includes('admin') ? 'admin' : 'employee';
      await setDoc(userRef, {
        uid: fbUser.uid,
        name: fbUser.displayName,
        email: fbUser.email,
        role: role,
        isProfileComplete: false,
        createdAt: serverTimestamp(),
        faceprint: fbUser.photoURL, // Use Google's photo as a placeholder
      });
    }
    return result;
  }, []);

  const register = useCallback(async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = userCredential.user;
        
    const role = email.toLowerCase().includes('admin') ? 'admin' : 'employee';
    
    // Create the user document in the top-level 'users' collection
    const userRef = doc(db, 'users', fbUser.uid);
    await setDoc(userRef, {
      uid: fbUser.uid,
      name: name,
      email: email,
      role: role,
      isProfileComplete: false, 
      createdAt: serverTimestamp(),
      faceprint: null,
    });
    
    return userCredential;
  }, []);

  const authContextValue = useMemo(
    () => ({
      user,
      firebaseUser,
      login,
      loginWithGoogle,
      register,
      logout,
      isAuthenticated: !!user && !!firebaseUser,
      loading,
      checkUserStatus
    }),
    [user, firebaseUser, login, loginWithGoogle, register, logout, loading, checkUserStatus]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}
