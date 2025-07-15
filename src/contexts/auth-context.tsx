
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
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
    const initializeAuth = async () => {
        // This makes sure we wait for any redirect to complete before doing anything else.
        try {
            const result = await getRedirectResult(auth);
            if (result) {
                const user = result.user;
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    // This is a new Google Sign-In user
                    const newUserProfile: UserProfile = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        role: 'Industrialist', // Default role for new Google users
                        location: '',
                    };
                    await setDoc(userDocRef, newUserProfile);
                }
            }
        } catch (error) {
            console.error("Error processing redirect result:", error);
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                const userDocRef = doc(db, 'users', user.uid);
                try {
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        setUserProfile(userDoc.data() as UserProfile);
                    } else {
                        // This case can happen if a user was created in Auth but their Firestore doc failed.
                        // Or for a Google user whose doc creation was interrupted.
                        console.warn("User exists in Auth, but not in Firestore. Redirecting to login.");
                        await firebaseSignOut(auth); // Log them out to prevent inconsistent state
                    }
                } catch (e) {
                    console.error("Error fetching user document:", e);
                    setUserProfile(null);
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    };

    const unsubscribePromise = initializeAuth();

    return () => {
        unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
}, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await setPersistence(auth, browserLocalPersistence);
    await signInWithRedirect(auth, provider);
  };

  const signUpWithEmail = async (name: string, email: string, pass: string, role: UserRole) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      const user = result.user;
      
      const newUserProfile: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email,
        displayName: name,
        role,
        location: '',
      };

      if (role === 'Recycler') {
        newUserProfile.materials = [];
      } else if (role === 'Transporter') {
        newUserProfile.vehicleTypes = [];
      }
      
      await setDoc(doc(db, 'users', user.uid), newUserProfile);
      setUserProfile(newUserProfile as UserProfile);

    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };
  
  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  }

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) {
      throw new Error("You must be logged in to update your profile.");
    }
    
    const dataToUpdate: Partial<UserProfile> = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key as keyof UserProfile] = value;
      }
      return acc;
    }, {} as Partial<UserProfile>);


    if (Object.keys(dataToUpdate).length === 0) {
      return; 
    }

    try {
      if (data.displayName && data.displayName !== user.displayName) {
        await updateProfile(user, { displayName: data.displayName });
      }

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, dataToUpdate);

      setUserProfile(prevProfile => {
        if (!prevProfile) return null;
        return {
          ...prevProfile,
          ...dataToUpdate,
        };
      });

    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
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
