'use server';

import { createClient } from '@/lib/supabase/server';

export interface Curfew {
  id: string;
  tenant_id: string;
  created_by_admin_id: string;
  name: string;
  description: string | null;
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  days_of_week: string[];
  season: 'all_year' | 'summer' | 'winter' | 'custom';
  season_start_date: string | null;
  season_end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  admin_name?: string;
}

export interface CurfewException {
  id: string;
  curfew_id: string;
  tenant_id: string;
  created_by_admin_id: string;
  exception_date: string;
  reason: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all curfews for the current tenant
 */
export async function getCurfews(): Promise<Curfew[]> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('curfews')
    .select(`
      id,
      tenant_id,
      created_by_admin_id,
      name,
      description,
      start_time,
      end_time,
      days_of_week,
      season,
      season_start_date,
      season_end_date,
      is_active,
      created_at,
      updated_at,
      admin:user_profiles!created_by_admin_id(first_name, last_name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch curfews: ${error.message}`);
  }

  return (data || []).map((curfew: any) => ({
    ...curfew,
    admin_name: curfew.admin
      ? `${curfew.admin.first_name} ${curfew.admin.last_name}`
      : 'Unknown Admin',
  }));
}

/**
 * Get active curfews (is_active = true and within season dates)
 */
export async function getActiveCurfews(): Promise<Curfew[]> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('curfews')
    .select(`
      id,
      tenant_id,
      created_by_admin_id,
      name,
      description,
      start_time,
      end_time,
      days_of_week,
      season,
      season_start_date,
      season_end_date,
      is_active,
      created_at,
      updated_at,
      admin:user_profiles!created_by_admin_id(first_name, last_name)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch active curfews: ${error.message}`);
  }

  // Filter by season dates in application (for custom seasons)
  const filteredData = (data || []).filter((curfew: any) => {
    if (curfew.season === 'custom') {
      return curfew.season_start_date <= today && today <= curfew.season_end_date;
    }
    return true; // all_year, summer, winter are always "in season"
  });

  return filteredData.map((curfew: any) => ({
    ...curfew,
    admin_name: curfew.admin
      ? `${curfew.admin.first_name} ${curfew.admin.last_name}`
      : 'Unknown Admin',
  }));
}

/**
 * Get curfew statistics
 */
export async function getCurfewStats() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  // Total curfews
  const { count: totalCurfews } = await supabase
    .from('curfews')
    .select('id', { count: 'exact', head: true });

  // Active curfews
  const { count: activeCurfews } = await supabase
    .from('curfews')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  // Inactive curfews
  const { count: inactiveCurfews } = await supabase
    .from('curfews')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', false);

  // Total exceptions
  const { count: totalExceptions } = await supabase
    .from('curfew_exceptions')
    .select('id', { count: 'exact', head: true });

  return {
    totalCurfews: totalCurfews || 0,
    activeCurfews: activeCurfews || 0,
    inactiveCurfews: inactiveCurfews || 0,
    totalExceptions: totalExceptions || 0,
    enabled: (activeCurfews || 0) > 0,
  };
}

export interface CreateCurfewInput {
  name: string;
  description?: string;
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  days_of_week: string[];
  season: 'all_year' | 'summer' | 'winter' | 'custom';
  season_start_date?: string;
  season_end_date?: string;
  is_active: boolean;
}

/**
 * Get a single curfew by ID
 */
export async function getCurfewById(id: string): Promise<Curfew | null> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('curfews')
    .select(`
      id,
      tenant_id,
      created_by_admin_id,
      name,
      description,
      start_time,
      end_time,
      days_of_week,
      season,
      season_start_date,
      season_end_date,
      is_active,
      created_at,
      updated_at,
      admin:user_profiles!created_by_admin_id(first_name, last_name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch curfew: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    admin_name: data.admin
      ? `${data.admin.first_name} ${data.admin.last_name}`
      : 'Unknown Admin',
  };
}

/**
 * Create a new curfew
 */
export async function createCurfew(input: CreateCurfewInput): Promise<Curfew> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  // Get tenant_id from the user's JWT
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No valid session');
  }

  const base64Payload = session.access_token.split('.')[1];
  const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
  const tenantId = payload.tenant_id;

  if (!tenantId) {
    throw new Error('No tenant_id found in session');
  }

  const curfewData: any = {
    tenant_id: tenantId,
    created_by_admin_id: user.id,
    name: input.name,
    description: input.description || null,
    start_time: input.start_time,
    end_time: input.end_time,
    days_of_week: input.days_of_week,
    season: input.season,
    is_active: input.is_active,
  };

  // Add season dates only if custom season
  if (input.season === 'custom') {
    if (!input.season_start_date || !input.season_end_date) {
      throw new Error('Season start and end dates are required for custom season');
    }
    curfewData.season_start_date = input.season_start_date;
    curfewData.season_end_date = input.season_end_date;
  }

  const { data, error } = await supabase
    .from('curfews')
    .insert([curfewData])
    .select(`
      id,
      tenant_id,
      created_by_admin_id,
      name,
      description,
      start_time,
      end_time,
      days_of_week,
      season,
      season_start_date,
      season_end_date,
      is_active,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create curfew: ${error.message}`);
  }

  return data;
}

export interface UpdateCurfewInput {
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  days_of_week: string[];
  season: 'all_year' | 'summer' | 'winter' | 'custom';
  season_start_date?: string;
  season_end_date?: string;
  is_active: boolean;
}

/**
 * Update an existing curfew
 */
export async function updateCurfew(id: string, input: UpdateCurfewInput): Promise<Curfew> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const updateData: any = {
    name: input.name,
    description: input.description || null,
    start_time: input.start_time,
    end_time: input.end_time,
    days_of_week: input.days_of_week,
    season: input.season,
    is_active: input.is_active,
    updated_at: new Date().toISOString(),
  };

  // Handle season dates
  if (input.season === 'custom') {
    if (!input.season_start_date || !input.season_end_date) {
      throw new Error('Season start and end dates are required for custom season');
    }
    updateData.season_start_date = input.season_start_date;
    updateData.season_end_date = input.season_end_date;
  } else {
    // Clear season dates if not custom
    updateData.season_start_date = null;
    updateData.season_end_date = null;
  }

  const { data, error } = await supabase
    .from('curfews')
    .update(updateData)
    .eq('id', id)
    .select(`
      id,
      tenant_id,
      created_by_admin_id,
      name,
      description,
      start_time,
      end_time,
      days_of_week,
      season,
      season_start_date,
      season_end_date,
      is_active,
      created_at,
      updated_at,
      admin:user_profiles!created_by_admin_id(first_name, last_name)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to update curfew: ${error.message}`);
  }

  return {
    ...data,
    admin_name: data.admin
      ? `${data.admin.first_name} ${data.admin.last_name}`
      : 'Unknown Admin',
  };
}

/**
 * Delete a curfew
 */
export async function deleteCurfew(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('curfews')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete curfew: ${error.message}`);
  }
}

// ============ Curfew Exceptions ============

/**
 * Get exceptions for a specific curfew
 */
export async function getCurfewExceptions(curfewId: string): Promise<CurfewException[]> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('curfew_exceptions')
    .select('*')
    .eq('curfew_id', curfewId)
    .order('exception_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch curfew exceptions: ${error.message}`);
  }

  return data || [];
}

export interface CreateCurfewExceptionInput {
  curfew_id: string;
  exception_date: string;
  reason: string;
}

/**
 * Create a new curfew exception
 */
export async function createCurfewException(input: CreateCurfewExceptionInput): Promise<CurfewException> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  // Get tenant_id from the user's JWT
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No valid session');
  }

  const base64Payload = session.access_token.split('.')[1];
  const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
  const tenantId = payload.tenant_id;

  if (!tenantId) {
    throw new Error('No tenant_id found in session');
  }

  const { data, error } = await supabase
    .from('curfew_exceptions')
    .insert([{
      curfew_id: input.curfew_id,
      tenant_id: tenantId,
      created_by_admin_id: user.id,
      exception_date: input.exception_date,
      reason: input.reason,
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create curfew exception: ${error.message}`);
  }

  return data;
}

/**
 * Delete a curfew exception
 */
export async function deleteCurfewException(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('curfew_exceptions')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete curfew exception: ${error.message}`);
  }
}
