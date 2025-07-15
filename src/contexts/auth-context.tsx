
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
    const processUser = async (user: User) => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
        } else {
            // This is a new user, likely from Google Sign-In, whose doc doesn't exist yet.
            // Let's create it.
            console.log("User document does not exist, creating new one for Google user.");
            const newUserProfile: UserProfile = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: 'Industrialist', // Default role for new Google users
                location: '',
            };
            await setDoc(userDocRef, newUserProfile);
            setUserProfile(newUserProfile);
        }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            setUser(user);
            await processUser(user);
        } else {
            setUser(null);
            setUserProfile(null);
        }
        setLoading(false);
    });

    // Separately handle the redirect result to avoid race conditions
    getRedirectResult(auth).catch(error => {
        console.error("Error processing redirect result:", error);
        setLoading(false);
    });

    return () => unsubscribe();
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
      
      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: name,
        role,
        location: '',
        ...(role === 'Recycler' && { materials: [] }),
        ...(role === 'Transporter' && { vehicleTypes: [] }),
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
    
    // Filter out any undefined values to prevent Firestore errors
    const dataToUpdate = Object.entries(data).reduce((acc, [key, value]) => {
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
