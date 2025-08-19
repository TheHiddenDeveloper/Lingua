
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
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import type { AuthContextType, LoginCredentials, SignupCredentials, UserProfileUpdateData } from '@/types/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // This function will handle the entire auth initialization process.
    const initializeAuth = async () => {
      try {
        // First, check if there's a redirect result from Google Sign-In.
        // This promise resolves to null if the user just visited the page without a redirect.
        const result = await getRedirectResult(auth);
        
        if (result) {
          // User signed in via redirect.
          const loggedInUser = result.user;
          setUser(loggedInUser); // Set user state immediately
          toast({ title: 'Signed in with Google', description: `Welcome back, ${loggedInUser.displayName || loggedInUser.email}!` });
          router.push('/translate'); // Redirect to a protected route
        }
      } catch (error: any) {
        console.error("Google Sign-In Redirect Error:", error);
        let errorMessage = error.message || 'Google Sign-In failed. Please try again.';
        if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = 'An account already exists with this email using a different sign-in method.';
        }
        toast({ title: 'Google Sign-In Error', description: errorMessage, variant: 'destructive' });
      }

      // After handling redirect, set up the onAuthStateChanged listener.
      // This will manage the user's session state going forward.
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setInitialLoad(false); // Mark initial load as complete
        setLoading(false); // Stop loading indicator
      });

      // Cleanup the listener on unmount
      return () => unsubscribe();
    };

    initializeAuth();
    // The dependency array is empty, so this runs only once on component mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      router.push('/translate');
    } catch (error: any) {
      toast({ title: 'Login Failed', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
      router.push('/translate');
    } catch (error: any) {
      toast({ title: 'Signup Failed', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      // Initiates the redirect. The result is handled by the useEffect hook.
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Google Sign-In Redirect Initiation Error:", error);
      toast({ title: 'Sign-In Error', description: 'Could not start the Google Sign-In process. Please try again.', variant: 'destructive' });
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
    } finally {
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
      // Create a new object to force re-render in components that use the user object
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

  const value = { user, loading, initialLoad, login, signup, logout, updateUserProfile, sendPasswordReset, signInWithGoogle };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
