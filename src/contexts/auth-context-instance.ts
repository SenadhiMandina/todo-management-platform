import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

// The React context object lives in its own non-component module so that
// both `AuthContext.tsx` (the provider component) and `useAuth.ts` (the
// hook) can import it without either file mixing component + non-component
// exports (which breaks React Fast Refresh / react-refresh lint rule).
export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});
