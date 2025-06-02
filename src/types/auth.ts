import type { User } from 'firebase/auth';

export interface LoginCredentials {
  email: string;
  password?: string; // Optional for social logins if added later
}

export interface SignupCredentials extends LoginCredentials {
  password_confirm?: string; // Optional, if you add password confirmation
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
}
