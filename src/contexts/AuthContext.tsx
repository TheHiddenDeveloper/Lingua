
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
  sendPasswordResetEmail,
  GoogleAuthProvider, // Added
  signInWithPopup     // Added
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
      // Redirect is handled by useEffect in login/signup pages watching 'user' state
      // router.push('/translate'); 
    } catch (error: any) {
      toast({ title: 'Login Failed', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      throw error; // Re-throw to be caught by calling component if needed
    }
    finally {
      setLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
      // Redirect is handled by useEffect in login/signup pages watching 'user' state
      // router.push('/translate');
    } catch (error: any) {
      toast({ title: 'Signup Failed', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      throw error; // Re-throw to be caught by calling component if needed
    } 
    finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Redirect is handled by useEffect in login/signup pages watching 'user' state
      // router.push('/translate'); 
      toast({ title: 'Signed in with Google', description: 'Successfully signed in with your Google account.' });
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      let errorMessage = error.message || 'Google Sign-In failed. Please try again.';
      if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Google Sign-In cancelled by user.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = 'An account already exists with this email using a different sign-in method. Try signing in with that method.';
      }
      toast({ title: 'Google Sign-In Error', description: errorMessage, variant: 'destructive' });
      // Do not re-throw, error is handled by toast
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error: any) {
      toast({ title: 'Logout Failed', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    }
    finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (data: UserProfileUpdateData) => {
    if (!auth.currentUser) {
      toast({ title: 'Authentication Error', description: 'User not authenticated.', variant: 'destructive'});
      throw new Error('User not authenticated.');
    }
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, data);
      setUser(auth.currentUser ? { ...auth.currentUser } : null);
      toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' });
    } catch (error: any) {
      toast({ title: 'Profile Update Failed', description: error.message, variant: 'destructive' });
      throw error; 
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async () => {
    if (!auth.currentUser || !auth.currentUser.email) {
      toast({ title: 'Error', description: 'User not authenticated or email not available for password reset.', variant: 'destructive'});
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

  const value = { user, loading, login, signup, logout, updateUserProfile, sendPasswordReset, signInWithGoogle };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

