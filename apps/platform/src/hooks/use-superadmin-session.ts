'use client';

/**
 * Superadmin Session Hook (T057)
 *
 * Custom React hook for managing superadmin authentication state:
 * - Fetches user profile from Supabase
 * - Verifies superadmin role
 * - Provides loading and error states
 * - Uses TanStack Query for caching and automatic revalidation
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  tenant_id: string | null;
  role: 'superadmin' | 'admin_head' | 'admin_officer' | 'household_head' | 'household_member' | 'beneficial_user' | 'security_head' | 'security_officer';
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phone_number: string | null;
  position: string | null;
  created_at: string;
  updated_at: string;
}

export interface SuperadminSession {
  user: User;
  profile: UserProfile;
}

/**
 * Fetch the current authenticated user from Supabase
 */
async function fetchCurrentUser(): Promise<User | null> {
  const supabase = createBrowserClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return user;
}

/**
 * Fetch user profile from database
 */
async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data as UserProfile;
}

/**
 * Fetch complete superadmin session (user + profile)
 */
async function fetchSuperadminSession(): Promise<SuperadminSession | null> {
  const user = await fetchCurrentUser();

  if (!user) {
    return null;
  }

  const profile = await fetchUserProfile(user.id);

  if (!profile) {
    return null;
  }

  // Verify superadmin role
  if (profile.role !== 'superadmin') {
    throw new Error('Access denied: Superadmin role required');
  }

  return { user, profile };
}

export interface UseSuperadminSessionOptions {
  /**
   * Whether to redirect to login if not authenticated
   * @default true
   */
  redirectToLogin?: boolean;

  /**
   * Custom redirect path for unauthenticated users
   * @default '/login'
   */
  loginPath?: string;
}

/**
 * Hook to manage superadmin session state
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { session, profile, isLoading, error } = useSuperadminSession();
 *
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error message={error.message} />;
 *   if (!session) return <Unauthorized />;
 *
 *   return <div>Welcome, {profile.first_name}!</div>;
 * }
 * ```
 */
export function useSuperadminSession(options: UseSuperadminSessionOptions = {}) {
  const {
    redirectToLogin = true,
    loginPath = '/login',
  } = options;

  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: session,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['superadmin-session'],
    queryFn: fetchSuperadminSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Redirect to login if not authenticated and redirectToLogin is true
  if (!isLoading && !session && !error && redirectToLogin) {
    router.push(loginPath);
  }

  // Sign out function
  const signOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    queryClient.clear();
    router.push(loginPath);
    router.refresh();
  };

  return {
    /** Complete session object (user + profile) */
    session,

    /** Authenticated user */
    user: session?.user ?? null,

    /** User profile with role information */
    profile: session?.profile ?? null,

    /** Whether the session is being loaded */
    isLoading,

    /** Error if session fetch failed */
    error: error as Error | null,

    /** Whether user is authenticated */
    isAuthenticated: !!session,

    /** Whether user has superadmin role */
    isSuperadmin: session?.profile.role === 'superadmin',

    /** Refetch session manually */
    refetch,

    /** Sign out current user */
    signOut,
  };
}

/**
 * Hook to get user's display name
 */
export function useDisplayName() {
  const { profile } = useSuperadminSession({ redirectToLogin: false });

  if (!profile) return 'User';

  const { first_name, middle_name, last_name } = profile;

  if (middle_name) {
    return `${first_name} ${middle_name} ${last_name}`;
  }

  return `${first_name} ${last_name}`;
}

/**
 * Hook to get user initials for avatar
 */
export function useUserInitials() {
  const { profile } = useSuperadminSession({ redirectToLogin: false });

  if (!profile) return 'U';

  const { first_name, last_name } = profile;

  return `${first_name[0]}${last_name[0]}`.toUpperCase();
}
