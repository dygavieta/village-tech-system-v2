'use server';

/**
 * Create Tenant Server Action (T065)
 *
 * Server action that calls the create-tenant Edge Function:
 * - Validates input data
 * - Calls Supabase Edge Function
 * - Handles errors gracefully
 * - Returns result to client
 */

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Property {
  address: string;
  phase?: string;
  block?: string;
  lot?: string;
  unit?: string;
  property_type: 'single_family' | 'townhouse' | 'condo' | 'lot_only';
  property_size_sqm?: number;
  lot_size_sqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking_slots?: number;
}

export interface Gate {
  name: string;
  gate_type: 'primary' | 'secondary' | 'service' | 'emergency';
  operating_hours_start?: string;
  operating_hours_end?: string;
  gps_lat?: number;
  gps_lng?: number;
  rfid_reader_serial?: string;
}

export interface CreateTenantInput {
  // Tenant Info
  name: string;
  legal_name?: string;
  subdomain: string;
  community_type: 'HOA' | 'Condo' | 'Gated Village' | 'Subdivision';
  year_established?: number;
  timezone?: string;
  language?: string;

  // Subscription Limits
  max_residences: number;
  max_admin_users?: number;
  max_security_users?: number;
  storage_quota_gb?: number;

  // Properties
  properties?: Property[];

  // Gates
  gates?: Gate[];

  // Admin Head
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
  admin_phone?: string;
  admin_position?: string;
}

export interface CreateTenantResult {
  success: boolean;
  tenant_id?: string;
  subdomain?: string;
  admin_user_id?: string;
  properties_created?: number;
  gates_created?: number;
  error?: string;
}

/**
 * Validate tenant creation input
 */
function validateInput(input: CreateTenantInput): string | null {
  if (!input.name || input.name.trim().length < 3) {
    return 'Tenant name must be at least 3 characters';
  }

  if (!input.subdomain || input.subdomain.trim().length < 3) {
    return 'Subdomain must be at least 3 characters';
  }

  if (!input.admin_email || !input.admin_email.includes('@')) {
    return 'Valid admin email is required';
  }

  if (!input.admin_first_name || !input.admin_last_name) {
    return 'Admin first name and last name are required';
  }

  if (input.max_residences < 1) {
    return 'Maximum residences must be at least 1';
  }

  return null;
}

/**
 * Create a new tenant with complete provisioning
 */
export async function createTenant(input: CreateTenantInput): Promise<CreateTenantResult> {
  try {
    // Validate input
    const validationError = validateInput(input);
    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    // Create Supabase server client
    const supabase = createServerClient();

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Verify superadmin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'superadmin') {
      return {
        success: false,
        error: 'Forbidden: Superadmin access required',
      };
    }

    // Call Edge Function
    const { data, error } = await supabase.functions.invoke('create-tenant', {
      body: input,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create tenant',
      };
    }

    if (!data || !data.success) {
      return {
        success: false,
        error: data?.error || 'Unknown error occurred',
      };
    }

    // Revalidate tenants page to show new tenant
    revalidatePath('/dashboard/tenants');

    return {
      success: true,
      tenant_id: data.tenant_id,
      subdomain: data.subdomain,
      admin_user_id: data.admin_user_id,
      properties_created: data.properties_created || 0,
      gates_created: data.gates_created || 0,
    };
  } catch (error) {
    console.error('Unexpected error in createTenant:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Validate subdomain availability (separate action for real-time validation)
 */
export async function validateSubdomain(subdomain: string): Promise<{ available: boolean; error?: string }> {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('tenants')
      .select('subdomain')
      .eq('subdomain', subdomain.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      return { available: false, error: 'Failed to check subdomain availability' };
    }

    return { available: !data };
  } catch (error) {
    return { available: false, error: 'An unexpected error occurred' };
  }
}
