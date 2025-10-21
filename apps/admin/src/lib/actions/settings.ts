'use server';

import { createClient } from '@/lib/supabase/server';

export interface SettingsStats {
  totalRules: number;
  gatesConfigured: number;
  curfewEnabled: boolean;
  notificationsEnabled: boolean;
  totalAdminUsers: number;
  villageRulesLastUpdated: string | null;
}

export interface SettingsSection {
  id: string;
  title: string;
  description: string;
  status: 'configured' | 'enabled' | 'disabled';
  lastUpdated: string | null;
  stats: string;
}

/**
 * Get settings statistics for the current tenant
 */
export async function getSettingsStats(): Promise<SettingsStats> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  // Get total published rules
  const { count: totalRules } = await supabase
    .from('village_rules')
    .select('id', { count: 'exact', head: true })
    .not('published_at', 'is', null);

  // Get active gates
  const { count: gatesConfigured } = await supabase
    .from('gates')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  // Check if active curfews exist
  const { count: curfewRulesCount } = await supabase
    .from('curfews')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  // Get admin users count
  const { count: totalAdminUsers } = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .in('role', ['admin_head', 'admin_officer']);

  // Get last updated village rule
  const { data: lastRule } = await supabase
    .from('village_rules')
    .select('updated_at')
    .not('published_at', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  return {
    totalRules: totalRules || 0,
    gatesConfigured: gatesConfigured || 0,
    curfewEnabled: (curfewRulesCount || 0) > 0,
    notificationsEnabled: true, // Always enabled as per system design
    totalAdminUsers: totalAdminUsers || 0,
    villageRulesLastUpdated: lastRule?.updated_at || null,
  };
}

/**
 * Get detailed settings sections with their status
 */
export async function getSettingsSections(): Promise<SettingsSection[]> {
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

  // Get rules stats
  const { count: totalRules } = await supabase
    .from('village_rules')
    .select('id', { count: 'exact', head: true })
    .not('published_at', 'is', null);

  const { data: lastRule } = await supabase
    .from('village_rules')
    .select('updated_at')
    .not('published_at', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  // Get gates stats
  const { count: gatesConfigured } = await supabase
    .from('gates')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  const { data: lastGate } = await supabase
    .from('gates')
    .select('updated_at')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  // Check active curfews
  const { count: curfewRulesCount } = await supabase
    .from('curfews')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  const { data: lastCurfew } = await supabase
    .from('curfews')
    .select('updated_at')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  // Get admin users count
  const { count: totalAdminUsers } = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .in('role', ['admin_head', 'admin_officer']);

  const { data: lastAdminUpdate } = await supabase
    .from('user_profiles')
    .select('updated_at')
    .in('role', ['admin_head', 'admin_officer'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  // Get tenant settings (branding and sticker allocation)
  const { data: tenant } = await supabase
    .from('tenants')
    .select('updated_at, logo_url, primary_color, default_sticker_allocation')
    .eq('id', userProfile.tenant_id)
    .single();

  const defaultStickerAllocation = tenant?.default_sticker_allocation || 3;

  const sections: SettingsSection[] = [
    {
      id: 'village-rules',
      title: 'Village Rules',
      description: 'Manage community policies, regulations, and guidelines',
      status: (totalRules || 0) > 0 ? 'configured' : 'disabled',
      lastUpdated: lastRule?.updated_at || null,
      stats: `${totalRules || 0} active rules`,
    },
    {
      id: 'gates',
      title: 'Gates & Access Control',
      description: 'Configure gates, operating hours, and security settings',
      status: (gatesConfigured || 0) > 0 ? 'configured' : 'disabled',
      lastUpdated: lastGate?.updated_at || null,
      stats: `${gatesConfigured || 0} gates active`,
    },
    {
      id: 'allocations',
      title: 'Sticker Allocations',
      description: 'Configure default sticker allocation limits per household',
      status: 'configured',
      lastUpdated: tenant?.updated_at || null,
      stats: `Default: ${defaultStickerAllocation} stickers`,
    },
    {
      id: 'curfew',
      title: 'Curfew Settings',
      description: 'Set curfew hours, exceptions, and seasonal adjustments',
      status: (curfewRulesCount || 0) > 0 ? 'enabled' : 'disabled',
      lastUpdated: lastCurfew?.updated_at || null,
      stats: (curfewRulesCount || 0) > 0 ? `${curfewRulesCount} active curfew${curfewRulesCount === 1 ? '' : 's'}` : 'No active curfews',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure notification preferences and delivery channels',
      status: 'enabled',
      lastUpdated: null,
      stats: 'Push, Email, SMS',
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage admin officers, roles, and permissions',
      status: (totalAdminUsers || 0) > 0 ? 'configured' : 'disabled',
      lastUpdated: lastAdminUpdate?.updated_at || null,
      stats: `${totalAdminUsers || 0} admin users`,
    },
    {
      id: 'branding',
      title: 'Appearance & Branding',
      description: 'Customize logo, colors, and community branding',
      status: tenant?.logo_url && tenant?.primary_color ? 'configured' : 'disabled',
      lastUpdated: tenant?.updated_at || null,
      stats: tenant?.logo_url && tenant?.primary_color ? 'Custom theme active' : 'Default theme',
    },
  ];

  return sections;
}

/**
 * Update tenant sticker allocation setting
 */
export async function updateStickerAllocation(allocation: number) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  // Validate allocation is within acceptable range
  if (allocation < 1 || allocation > 20) {
    throw new Error('Allocation must be between 1 and 20');
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

  // Update tenant's default sticker allocation
  const { error } = await supabase
    .from('tenants')
    .update({
      default_sticker_allocation: allocation,
      updated_at: new Date().toISOString()
    })
    .eq('id', userProfile.tenant_id);

  if (error) {
    throw error;
  }

  return { success: true };
}

/**
 * Get tenant sticker allocation setting
 */
export async function getStickerAllocation(): Promise<number> {
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

  // Get tenant's default sticker allocation
  const { data: tenant } = await supabase
    .from('tenants')
    .select('default_sticker_allocation')
    .eq('id', userProfile.tenant_id)
    .single();

  return tenant?.default_sticker_allocation || 3;
}

/**
 * Update individual household sticker allocation (override)
 */
export async function updateHouseholdAllocation(
  householdId: string,
  newAllocation: number,
  justification: string
) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  // Validate allocation is within acceptable range
  if (newAllocation < 1 || newAllocation > 20) {
    throw new Error('Allocation must be between 1 and 20');
  }

  // Validate justification is provided
  if (!justification || justification.trim().length === 0) {
    throw new Error('Justification is required for allocation changes');
  }

  // Get user's tenant_id from their profile
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile?.tenant_id) {
    throw new Error('Tenant not found');
  }

  // Verify user has admin permissions
  if (!['admin_head', 'admin_officer'].includes(userProfile.role)) {
    throw new Error('Insufficient permissions');
  }

  // Verify household belongs to the same tenant
  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('id, tenant_id, sticker_allocation')
    .eq('id', householdId)
    .eq('tenant_id', userProfile.tenant_id)
    .single();

  if (householdError || !household) {
    throw new Error('Household not found or access denied');
  }

  // Check current sticker usage (count active and pending stickers)
  const { count: usedStickers } = await supabase
    .from('vehicle_stickers')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .in('status', ['pending', 'approved', 'ready_for_pickup', 'issued']);

  // Validate new allocation is not less than currently used stickers
  if (newAllocation < (usedStickers || 0)) {
    throw new Error(
      `Cannot set allocation below ${usedStickers} (household already has ${usedStickers} active/pending stickers)`
    );
  }

  // Update household sticker allocation
  const { error: updateError } = await supabase
    .from('households')
    .update({
      sticker_allocation: newAllocation,
      updated_at: new Date().toISOString()
    })
    .eq('id', householdId);

  if (updateError) {
    throw updateError;
  }

  // Log the allocation change (optional - you could create an audit log table)
  console.log(`Allocation override for household ${householdId}:`, {
    old_allocation: household.sticker_allocation,
    new_allocation: newAllocation,
    justification,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  });

  return { success: true, newAllocation };
}
