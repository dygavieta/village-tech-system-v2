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

  // Get sticker allocation from tenant settings (default is 3)
  const defaultStickerAllocation = 3;

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

  // Get tenant branding info
  const { data: tenant } = await supabase
    .from('tenants')
    .select('updated_at, logo_url, primary_color')
    .single();

  const sections: SettingsSection[] = [
    {
      id: 'village-rules',
      title: 'Village Rules',
      description: 'Manage community policies, regulations, and guidelines',
      status: 'configured',
      lastUpdated: lastRule?.updated_at || null,
      stats: `${totalRules || 0} active rules`,
    },
    {
      id: 'gates',
      title: 'Gates & Access Control',
      description: 'Configure gates, operating hours, and security settings',
      status: 'configured',
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
      status: 'configured',
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
