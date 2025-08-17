
import type { User } from 'firebase/auth';

export interface LoginCredentials {
  email: string;
  password?: string; // Optional for social logins if added later
}

export interface SignupCredentials extends LoginCredentials {
  password_confirm?: string; // Optional, if you add password confirmation
}

export interface UserProfileUpdateData {
  displayName?: string;
  // photoURL?: string; // Example, can be added if profile picture update is needed
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialLoad: boolean; // Tracks the initial onAuthStateChanged check
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: UserProfileUpdateData) => Promise<void>;
  sendPasswordReset: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}
