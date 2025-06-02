
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import type { AuthContextType, LoginCredentials, SignupCredentials, UserProfileUpdateData } from '@/types/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      router.push('/translate');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
      // Note: Firebase automatically signs in the user after successful creation.
      router.push('/translate');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (data: UserProfileUpdateData) => {
    if (!auth.currentUser) {
      throw new Error('User not authenticated.');
    }
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, data);
      // Update local user state to reflect changes immediately
      setUser(auth.currentUser ? { ...auth.currentUser } : null);
      toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' });
    } catch (error: any) {
      toast({ title: 'Profile Update Failed', description: error.message, variant: 'destructive' });
      throw error; // Re-throw to be caught by calling component if needed
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async () => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('User not authenticated or email not available.');
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      toast({ title: 'Password Reset Email Sent', description: `A password reset email has been sent to ${auth.currentUser.email}. Please check your inbox.` });
    } catch (error: any) {
      toast({ title: 'Password Reset Failed', description: error.message, variant: 'destructive' });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = { user, loading, login, signup, logout, updateUserProfile, sendPasswordReset };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
