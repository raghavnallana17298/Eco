
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
  updateUserProfile: (data: { displayName?: string; }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // This is a more robust way to handle auth in Next.js
    const initializeAuth = async () => {
      // Set persistence at the very start
      await setPersistence(auth, browserLocalPersistence);

      // Handle the redirect result from Google sign-in
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          // If the user is new (doesn't exist in Firestore), create their profile
          if (!userDoc.exists()) {
            const newUserProfile: UserProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              role: 'Industrialist', // Default role for new Google sign-ins
            };
            await setDoc(userDocRef, newUserProfile);
          }
        }
      } catch (error) {
        // This can happen if the user closes the popup, etc.
        console.error("Error processing redirect result:", error);
      }

      // Now, set up the listener for auth state changes
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUser(user);
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
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
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Error during Google sign-in redirect:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (name: string, email: string, pass: string, role: UserRole) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      const user = result.user;
      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: name,
        role,
      };
      await setDoc(doc(db, 'users', user.uid), newUserProfile);
      setUserProfile(newUserProfile);
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };
  
  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  }

  const updateUserProfile = async (data: { displayName?: string; }) => {
    if (!user) {
      throw new Error("You must be logged in to update your profile.");
    }

    const dataToUpdate: { displayName?: string } = {};
    if (data.displayName) {
      dataToUpdate.displayName = data.displayName;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return; // Nothing to update
    }

    try {
      // Update Firebase Auth profile if displayName is being changed
      if (data.displayName) {
        await updateProfile(user, { displayName: data.displayName });
      }

      // Update Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, dataToUpdate);

      // Update local state
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
    router.push('/');
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
