'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

export interface AdminProfile {
  id: string;
  tenant_id: string;
  role: 'admin_head' | 'admin_officer';
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phone_number: string | null;
  position: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AdminSession {
  user: {
    id: string;
    email: string;
  };
  profile: AdminProfile;
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    logo_url: string | null;
  };
}

export function useAdminSession() {
  const router = useRouter();
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: ['admin-session'],
    queryFn: async (): Promise<AdminSession> => {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Not authenticated');
      }

      // Fetch user profile with tenant data
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          tenant_id,
          role,
          first_name,
          middle_name,
          last_name,
          phone_number,
          position,
          created_at,
          updated_at
        `)
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Profile not found');
      }

      // Verify admin role
      if (!['admin_head', 'admin_officer'].includes(profile.role)) {
        throw new Error('Insufficient permissions');
      }

      // Fetch tenant information
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, subdomain, logo_url')
        .eq('id', profile.tenant_id)
        .single();

      if (tenantError || !tenant) {
        throw new Error('Tenant not found');
      }

      return {
        user: {
          id: user.id,
          email: user.email!,
        },
        profile: {
          ...profile,
          email: user.email!,
        } as AdminProfile,
        tenant,
      };
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to require authentication and redirect if not authenticated
 */
export function useRequireAuth() {
  const router = useRouter();
  const { data, isLoading, error } = useAdminSession();

  // Redirect to login if not authenticated
  if (!isLoading && (error || !data)) {
    router.push('/login');
    return { session: null, isLoading: false };
  }

  return {
    session: data,
    isLoading,
  };
}

/**
 * Hook to check if user has specific role
 */
export function useCheckRole(allowedRoles: AdminProfile['role'][]) {
  const { data: session } = useAdminSession();

  return {
    hasRole: session ? allowedRoles.includes(session.profile.role) : false,
    role: session?.profile.role,
  };
}
