/**
 * Auth store for Admin app using Zustand
 * Manages admin officer session state and tenant context
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  tenantId: string | null;
  role: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setTenantId: (tenantId: string | null) => void;
  setRole: (role: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      tenantId: null,
      role: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setTenantId: (tenantId) => set({ tenantId }),
      setRole: (role) => set({ role }),
      setLoading: (isLoading) => set({ isLoading }),
      clear: () =>
        set({
          user: null,
          session: null,
          tenantId: null,
          role: null,
          isLoading: false,
        }),
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        // Only persist non-sensitive data
        user: state.user ? { id: state.user.id, email: state.user.email } : null,
        tenantId: state.tenantId,
        role: state.role,
      }),
    }
  )
);
