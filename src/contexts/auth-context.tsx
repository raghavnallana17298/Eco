
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  browserLocalPersistence, 
  setPersistence 
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import type { UserProfile, UserRole } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
        // If the doc doesn't exist, it will be created during signup.
        // For existing auth users without a doc, they might need to re-authenticate or be handled.
        
        setUser(currentUser);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUpWithEmail = async (name: string, email: string, pass: string, role: UserRole) => {
    await setPersistence(auth, browserLocalPersistence);
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const newUser = result.user;
    
    await updateProfile(newUser, { displayName: name });
    
    const newUserProfile: UserProfile = {
      uid: newUser.uid,
      email: newUser.email,
      displayName: name,
      role: role,
      location: '',
      ...(role === 'Recycler' && { materials: [] }),
      ...(role === 'Transporter' && { vehicleTypes: [] }),
    };
    
    await setDoc(doc(db, 'users', newUser.uid), newUserProfile);
    setUserProfile(newUserProfile);
    setUser(newUser);
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
