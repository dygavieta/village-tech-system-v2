'use server';

import { createClient } from '@/lib/supabase/server';

export interface AdminUserStats {
  totalUsers: number;
  adminHead: number;
  officers: number;
}

export interface AdminUser {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  phone_number: string | null;
  role: 'admin_head' | 'admin_officer';
  position: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get admin user statistics for the current tenant
 */
export async function getAdminUserStats(): Promise<AdminUserStats> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  // Get user's tenant_id from their profile
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile?.tenant_id) {
    throw new Error('Tenant not found');
  }

  // Count total admin users
  const { count: totalUsers } = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', userProfile.tenant_id)
    .in('role', ['admin_head', 'admin_officer']);

  // Count admin heads
  const { count: adminHead } = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', userProfile.tenant_id)
    .eq('role', 'admin_head');

  // Count officers
  const { count: officers } = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', userProfile.tenant_id)
    .eq('role', 'admin_officer');

  return {
    totalUsers: totalUsers || 0,
    adminHead: adminHead || 0,
    officers: officers || 0,
  };
}

/**
 * Get all admin users for the current tenant
 */
export async function getAdminUsers(): Promise<AdminUser[]> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  // Get user's tenant_id from their profile
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile?.tenant_id) {
    throw new Error('Tenant not found');
  }

  // We need to query auth.users directly since we need email addresses
  // Using a direct SQL query via RPC or raw query
  const { data: adminProfiles, error: adminError } = await supabase
    .from('user_profiles')
    .select(`
      id,
      first_name,
      middle_name,
      last_name,
      phone_number,
      role,
      position,
      created_at,
      updated_at
    `)
    .eq('tenant_id', userProfile.tenant_id)
    .in('role', ['admin_head', 'admin_officer'])
    .order('created_at', { ascending: true });

  if (adminError) {
    throw adminError;
  }

  // Get emails by querying the auth schema directly using a view or edge function
  // For now, we'll use a workaround - get the email from metadata or use a placeholder
  const adminUsers: AdminUser[] = (adminProfiles || []).map(profile => ({
    id: profile.id,
    first_name: profile.first_name,
    middle_name: profile.middle_name,
    last_name: profile.last_name,
    email: '', // Will be populated via client-side or separate query
    phone_number: profile.phone_number,
    role: profile.role as 'admin_head' | 'admin_officer',
    position: profile.position,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  }));

  // Get emails for each user from auth.users table using their IDs
  for (const adminUser of adminUsers) {
    const { data: authData } = await supabase.rpc('get_user_email', {
      user_id: adminUser.id
    });

    adminUser.email = authData || '';
  }

  return adminUsers;
}

export interface CreateAdminUserInput {
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  phone_number?: string;
  role: 'admin_head' | 'admin_officer';
  position?: string;
}

export interface CreateAdminUserResult {
  success: boolean;
  user_id?: string;
  email?: string;
  error?: string;
  details?: string;
}

/**
 * Create a new admin user via Edge Function
 */
export async function createAdminUser(
  input: CreateAdminUserInput
): Promise<CreateAdminUserResult> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  // Get user's tenant_id and role
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile?.tenant_id) {
    throw new Error('Tenant not found');
  }

  // Only admin_head can create admin users
  if (userProfile.role !== 'admin_head') {
    throw new Error('Only Admin Head can create admin users');
  }

  // Call Edge Function to create admin user
  const { data, error } = await supabase.functions.invoke('create-admin-user', {
    body: {
      email: input.email,
      tenant_id: userProfile.tenant_id,
      first_name: input.first_name,
      middle_name: input.middle_name || null,
      last_name: input.last_name,
      phone_number: input.phone_number || null,
      role: input.role,
      position: input.position || null,
    },
  });

  if (error) {
    return {
      success: false,
      error: 'Failed to create admin user',
      details: error.message,
    };
  }

  return data as CreateAdminUserResult;
}
