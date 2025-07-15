
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut as firebaseSignOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  browserLocalPersistence, 
  setPersistence 
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { UserProfile, UserRole } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (name: string, email: string, pass: string, role: UserRole) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          // This case handles a first-time sign-in where the user exists in Auth but not Firestore.
          // This is common for Google Sign-In on a fresh account.
          // The profile data will be created by the login functions (getRedirectResult or signUp).
          // We set a temporary minimal profile to avoid errors.
          setUserProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: 'Industrialist', // Default role
          });
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Handle the redirect result from Google Sign-In
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          setLoading(true);
          const user = result.user;
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            // This is a new user via Google Sign-In, create their profile.
            const newUserProfile: UserProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              role: 'Industrialist', // Default role for Google Sign-In
              location: '',
            };
            await setDoc(userDocRef, newUserProfile);
            setUserProfile(newUserProfile);
            setUser(user);
          }
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error processing redirect result:", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await setPersistence(auth, browserLocalPersistence);
    signInWithRedirect(auth, provider);
  };

  const signUpWithEmail = async (name: string, email: string, pass: string, role: UserRole) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const user = result.user;
    
    // Explicitly check role and build the profile object
    const newUserProfile: Partial<UserProfile> = {
      uid: user.uid,
      email: user.email,
      displayName: name,
      role,
      location: '',
    };
    if (role === 'Recycler') {
      newUserProfile.materials = [];
    }
    if (role === 'Transporter') {
      newUserProfile.vehicleTypes = [];
    }
    
    await setDoc(doc(db, 'users', user.uid), newUserProfile);
    setUserProfile(newUserProfile as UserProfile);
    setUser(user);
  };
  
  const signInWithEmail = async (email: string, pass: string) => {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithEmailAndPassword(auth, email, pass);
  }

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) {
      throw new Error("You must be logged in to update your profile.");
    }
    
    const dataToUpdate = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(dataToUpdate).length === 0) {
      return; 
    }

    if (data.displayName && data.displayName !== user.displayName) {
      await updateProfile(user, { displayName: data.displayName });
    }

    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, dataToUpdate);

    setUserProfile(prevProfile => {
      if (!prevProfile) return null;
      return { ...prevProfile, ...dataToUpdate };
    });
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    router.push('/login');
  };

  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
