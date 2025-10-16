'use server';

import { createClient } from '@/lib/supabase/server';

export type VillageRuleCategory = 'noise' | 'parking' | 'pets' | 'construction' | 'visitors' | 'general';

export interface VillageRule {
  id: string;
  tenant_id: string;
  created_by_admin_id: string;
  category: VillageRuleCategory;
  title: string;
  description: string;
  version: number;
  effective_date: string;
  published_at: string | null;
  requires_acknowledgment: boolean;
  created_at: string;
  updated_at: string;
  admin_name?: string;
  acknowledgment_count?: number;
}

export interface VillageRuleStats {
  totalRules: number;
  activeRules: number;
  draftRules: number;
  lastUpdated: string | null;
}

export interface CategoryStats {
  category: VillageRuleCategory;
  count: number;
}

/**
 * Get all village rules for the current tenant
 */
export async function getVillageRules(): Promise<VillageRule[]> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('village_rules')
    .select(`
      id,
      tenant_id,
      created_by_admin_id,
      category,
      title,
      description,
      version,
      effective_date,
      published_at,
      requires_acknowledgment,
      created_at,
      updated_at,
      admin:user_profiles!created_by_admin_id(first_name, last_name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch village rules: ${error.message}`);
  }

  // Get acknowledgment counts for each rule
  const rulesWithCounts = await Promise.all(
    (data || []).map(async (rule: any) => {
      const { count } = await supabase
        .from('rule_acknowledgments')
        .select('id', { count: 'exact', head: true })
        .eq('rule_id', rule.id);

      return {
        ...rule,
        admin_name: rule.admin
          ? `${rule.admin.first_name} ${rule.admin.last_name}`
          : 'Unknown Admin',
        acknowledgment_count: count || 0,
      };
    })
  );

  return rulesWithCounts;
}

/**
 * Get a single village rule by ID
 */
export async function getVillageRuleById(id: string): Promise<VillageRule | null> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('village_rules')
    .select(`
      id,
      tenant_id,
      created_by_admin_id,
      category,
      title,
      description,
      version,
      effective_date,
      published_at,
      requires_acknowledgment,
      created_at,
      updated_at,
      admin:user_profiles!created_by_admin_id(first_name, last_name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch village rule: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // Get acknowledgment count
  const { count } = await supabase
    .from('rule_acknowledgments')
    .select('id', { count: 'exact', head: true })
    .eq('rule_id', id);

  return {
    ...data,
    admin_name: data.admin
      ? `${data.admin.first_name} ${data.admin.last_name}`
      : 'Unknown Admin',
    acknowledgment_count: count || 0,
  };
}

/**
 * Get village rule statistics
 */
export async function getVillageRuleStats(): Promise<VillageRuleStats> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  // Total rules
  const { count: totalRules } = await supabase
    .from('village_rules')
    .select('id', { count: 'exact', head: true });

  // Active rules (published and effective)
  const { count: activeRules } = await supabase
    .from('village_rules')
    .select('id', { count: 'exact', head: true })
    .not('published_at', 'is', null)
    .lte('effective_date', new Date().toISOString().split('T')[0]);

  // Draft rules (not published)
  const { count: draftRules } = await supabase
    .from('village_rules')
    .select('id', { count: 'exact', head: true })
    .is('published_at', null);

  // Last updated
  const { data: lastUpdatedRule } = await supabase
    .from('village_rules')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  return {
    totalRules: totalRules || 0,
    activeRules: activeRules || 0,
    draftRules: draftRules || 0,
    lastUpdated: lastUpdatedRule?.updated_at || null,
  };
}

/**
 * Get category statistics
 */
export async function getCategoryStats(): Promise<CategoryStats[]> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('village_rules')
    .select('category');

  if (error) {
    throw new Error(`Failed to fetch category stats: ${error.message}`);
  }

  // Count rules per category
  const categoryCounts: Record<VillageRuleCategory, number> = {
    noise: 0,
    parking: 0,
    pets: 0,
    construction: 0,
    visitors: 0,
    general: 0,
  };

  (data || []).forEach((rule: { category: VillageRuleCategory }) => {
    categoryCounts[rule.category]++;
  });

  return Object.entries(categoryCounts)
    .filter(([_, count]) => count > 0)
    .map(([category, count]) => ({
      category: category as VillageRuleCategory,
      count,
    }));
}

export interface CreateVillageRuleInput {
  category: VillageRuleCategory;
  title: string;
  description: string;
  effective_date: string;
  requires_acknowledgment: boolean;
  publish_now?: boolean;
}

/**
 * Create a new village rule
 */
export async function createVillageRule(input: CreateVillageRuleInput): Promise<VillageRule> {
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

  const ruleData: any = {
    tenant_id: tenantId,
    created_by_admin_id: user.id,
    category: input.category,
    title: input.title,
    description: input.description,
    effective_date: input.effective_date,
    requires_acknowledgment: input.requires_acknowledgment,
    version: 1,
    published_at: input.publish_now ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from('village_rules')
    .insert([ruleData])
    .select(`
      id,
      tenant_id,
      created_by_admin_id,
      category,
      title,
      description,
      version,
      effective_date,
      published_at,
      requires_acknowledgment,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create village rule: ${error.message}`);
  }

  return {
    ...data,
    acknowledgment_count: 0,
  };
}

export interface UpdateVillageRuleInput {
  category: VillageRuleCategory;
  title: string;
  description: string;
  effective_date: string;
  requires_acknowledgment: boolean;
}

/**
 * Update an existing village rule
 */
export async function updateVillageRule(id: string, input: UpdateVillageRuleInput): Promise<VillageRule> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  // Get the current rule to check version
  const { data: currentRule } = await supabase
    .from('village_rules')
    .select('version')
    .eq('id', id)
    .single();

  const updateData: any = {
    category: input.category,
    title: input.title,
    description: input.description,
    effective_date: input.effective_date,
    requires_acknowledgment: input.requires_acknowledgment,
    version: currentRule ? currentRule.version + 1 : 1,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('village_rules')
    .update(updateData)
    .eq('id', id)
    .select(`
      id,
      tenant_id,
      created_by_admin_id,
      category,
      title,
      description,
      version,
      effective_date,
      published_at,
      requires_acknowledgment,
      created_at,
      updated_at,
      admin:user_profiles!created_by_admin_id(first_name, last_name)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to update village rule: ${error.message}`);
  }

  // Get acknowledgment count
  const { count } = await supabase
    .from('rule_acknowledgments')
    .select('id', { count: 'exact', head: true })
    .eq('rule_id', id);

  return {
    ...data,
    admin_name: data.admin
      ? `${data.admin.first_name} ${data.admin.last_name}`
      : 'Unknown Admin',
    acknowledgment_count: count || 0,
  };
}

/**
 * Publish a draft village rule
 */
export async function publishVillageRule(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('village_rules')
    .update({
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('published_at', null);

  if (error) {
    throw new Error(`Failed to publish village rule: ${error.message}`);
  }
}

/**
 * Delete a village rule
 */
export async function deleteVillageRule(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('village_rules')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete village rule: ${error.message}`);
  }
}
