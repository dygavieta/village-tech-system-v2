/**
 * Auth store for Platform app using Zustand
 * Manages superadmin session state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),
      clear: () => set({ user: null, session: null, isLoading: false }),
    }),
    {
      name: 'platform-auth-storage',
      partialize: (state) => ({
        // Only persist non-sensitive data
        user: state.user ? { id: state.user.id, email: state.user.email } : null,
      }),
    }
  )
);
