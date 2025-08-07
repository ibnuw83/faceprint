'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

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
};

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
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
      const role = userData.role || (fbUser.email?.toLowerCase().includes('admin') ? 'admin' : 'employee');
      
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
        role: role,
        isProfileComplete: userData.isProfileComplete || false,
        lastLocation: userData.lastLocation || null,
        locationSettings: locationSettings,
        faceprint: userData.faceprint || null,
        department: userData.department || null,
        employeeId: userData.employeeId || null,
      };
    }
     console.warn(`No user document found for UID: ${fbUser.uid}. This might be a new user or a deleted user.`);
    return null; // Return null if user doc doesn't exist
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

  const checkUserStatus = useCallback(async () => {
    setLoading(true);
    const fbUser = auth.currentUser;
    if (fbUser) {
        const appUser = await fetchUserData(fbUser);
        setUser(appUser);
    }
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setLoading(true);
        const userDocRef = doc(db, 'users', fbUser.uid);
        
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setFirebaseUser(fbUser);
            // The rest of the logic to set user state is handled in the next useEffect
          } else {
            // User exists in Auth, but not in Firestore (was deleted)
            toast({
              title: "Login Gagal: Akun Tidak Ditemukan",
              description: "Data pengguna tidak ditemukan. Silakan daftar ulang.",
              variant: "destructive",
            });
            await signOut(auth); // Force sign out
            setFirebaseUser(null);
            setUser(null);
          }
        } catch (error) {
           console.error("Error checking user document on auth state change:", error);
           await signOut(auth);
           setFirebaseUser(null);
           setUser(null);
        } finally {
            setLoading(false);
        }
      } else {
        // No user is signed in
        setFirebaseUser(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [toast]);


  useEffect(() => {
    if (firebaseUser) {
        setLoading(true);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                const role = userData.role || (firebaseUser.email?.toLowerCase().includes('admin') ? 'admin' : 'employee');
                
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
                 // This case should ideally be handled by the onAuthStateChanged logic
                 // But as a fallback, we sign the user out.
                 console.log("User document disappeared. Signing out.");
                 logout();
            }
            setLoading(false);
        }, (error) => {
            console.error("Error listening to user document:", error);
            setLoading(false);
        });

        return () => unsubscribeUser();
    } else {
        setUser(null);
        setLoading(false);
    }
  }, [firebaseUser, logout]);


  const login = useCallback(async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    // onAuthStateChanged will handle the rest
  }, []);

  const register = useCallback(async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = userCredential.user;
    
    await updateProfile(fbUser, { displayName: name });
    
    // In this app, all new sign-ups are employees. Admin role is set manually.
    const role = 'employee';

    const isProfileComplete = false; // New users must complete their profile

    const userRef = doc(db, "users", fbUser.uid);
    await setDoc(userRef, {
      uid: fbUser.uid,
      name: name,
      email: email,
      role: role,
      isProfileComplete: isProfileComplete, 
      createdAt: new Date(),
      faceprint: null,
    });
  }, []);

  const authContextValue = useMemo(
    () => ({
      user,
      firebaseUser,
      login,
      register,
      logout,
      isAuthenticated: !!user && !!firebaseUser,
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
