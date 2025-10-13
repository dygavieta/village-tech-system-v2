/**
 * Household Onboarding Service
 *
 * Handles household creation, assignment to properties, and household head user provisioning.
 * - Creates household record
 * - Assigns household to property
 * - Creates household head user with authentication credentials
 * - Sends welcome email with portal access details
 */

import { createClient } from '../supabase/client';

export interface CreateHouseholdInput {
  property_id: string;
  ownership_type: 'owner' | 'renter';
  move_in_date?: string;
  sticker_allocation?: number;
  // Household head details
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  phone_number?: string;
}

export interface CreateHouseholdResult {
  success: boolean;
  household_id?: string;
  household_head_id?: string;
  property_address?: string;
  temporary_password?: string;
  error?: string;
  details?: string;
}

/**
 * Generate a secure random password
 */
function generatePassword(length = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const all = lowercase + uppercase + numbers + special;

  let password = '';
  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Create a new household with household head user
 */
export async function createHousehold(
  input: CreateHouseholdInput
): Promise<CreateHouseholdResult> {
  try {
    const supabase = createClient();

    // Step 1: Get current session to verify admin and get tenant_id
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        success: false,
        error: 'Not authenticated',
        details: sessionError?.message,
      };
    }

    // Step 2: Get admin user profile to verify role and get tenant_id
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('user_profiles')
      .select('tenant_id, role')
      .eq('id', session.user.id)
      .single();

    if (adminProfileError || !adminProfile) {
      return {
        success: false,
        error: 'Failed to fetch admin profile',
        details: adminProfileError?.message,
      };
    }

    if (!['admin_head', 'admin_officer'].includes(adminProfile.role)) {
      return {
        success: false,
        error: 'Insufficient permissions',
        details: 'Only admin users can create households',
      };
    }

    const tenantId = adminProfile.tenant_id;

    // Step 3: Verify property exists and belongs to the same tenant
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, address, tenant_id, status')
      .eq('id', input.property_id)
      .single();

    if (propertyError || !property) {
      return {
        success: false,
        error: 'Property not found',
        details: propertyError?.message,
      };
    }

    if (property.tenant_id !== tenantId) {
      return {
        success: false,
        error: 'Property belongs to a different tenant',
      };
    }

    // Step 4: Check if property already has a household
    const { data: existingHousehold } = await supabase
      .from('households')
      .select('id')
      .eq('property_id', input.property_id)
      .maybeSingle();

    if (existingHousehold) {
      return {
        success: false,
        error: 'Property already has a household assigned',
        details: `Household ID: ${existingHousehold.id}`,
      };
    }

    // Step 5: Create household head user in Supabase Auth
    // Note: This requires using the service role key, which should be done via an Edge Function
    // For now, we'll create a placeholder and return instructions
    const temporaryPassword = generatePassword(12);

    // TODO: This should call an Edge Function to create the user with admin privileges
    // For now, we'll simulate the flow
    console.log('Would create user with:', {
      email: input.email,
      password: temporaryPassword,
      user_metadata: {
        tenant_id: tenantId,
        role: 'household_head',
        first_name: input.first_name,
        middle_name: input.middle_name,
        last_name: input.last_name,
        phone_number: input.phone_number,
      },
    });

    // In a real implementation, call an Edge Function:
    // const { data: authData, error: authError } = await supabase.functions.invoke('create-household-user', {
    //   body: { email: input.email, ... }
    // });

    // For now, return a placeholder response
    return {
      success: false,
      error: 'Not implemented',
      details:
        'Household creation requires an Edge Function to create users. This will be implemented in the next phase.',
    };

    // Step 6: Create household record (will be uncommented after Edge Function is ready)
    // const { data: household, error: householdError } = await supabase
    //   .from('households')
    //   .insert({
    //     tenant_id: tenantId,
    //     property_id: input.property_id,
    //     household_head_id: authData.user_id,
    //     ownership_type: input.ownership_type,
    //     move_in_date: input.move_in_date || null,
    //     sticker_allocation: input.sticker_allocation || 3,
    //   })
    //   .select('id')
    //   .single();

    // Step 7: Update property status to occupied
    // await supabase
    //   .from('properties')
    //   .update({ status: 'occupied' })
    //   .eq('id', input.property_id);

    // Step 8: Send welcome email (via Edge Function or email service)
    // TODO: Integrate with email service

    // return {
    //   success: true,
    //   household_id: household.id,
    //   household_head_id: authData.user_id,
    //   property_address: property.address,
    //   temporary_password: temporaryPassword,
    // };
  } catch (error) {
    console.error('Household creation error:', error);
    return {
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all households for the current tenant
 */
export async function getHouseholds() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('households')
    .select(
      `
      id,
      move_in_date,
      ownership_type,
      sticker_allocation,
      created_at,
      property:properties (
        id,
        address,
        phase,
        block,
        lot,
        unit,
        property_type
      ),
      household_head:user_profiles!household_head_id (
        id,
        first_name,
        last_name,
        phone_number,
        position
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch households:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get a single household by ID
 */
export async function getHouseholdById(householdId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('households')
    .select(
      `
      id,
      move_in_date,
      ownership_type,
      sticker_allocation,
      created_at,
      updated_at,
      property:properties (
        id,
        address,
        phase,
        block,
        lot,
        unit,
        property_type,
        property_size_sqm,
        bedrooms,
        bathrooms,
        parking_slots
      ),
      household_head:user_profiles!household_head_id (
        id,
        first_name,
        middle_name,
        last_name,
        phone_number,
        position
      ),
      household_members (
        id,
        first_name,
        last_name,
        relationship,
        age,
        is_minor
      ),
      vehicle_stickers (
        id,
        vehicle_plate,
        vehicle_make,
        vehicle_color,
        sticker_type,
        status,
        rfid_serial,
        issue_date,
        expiry_date
      )
    `
    )
    .eq('id', householdId)
    .single();

  if (error) {
    console.error('Failed to fetch household:', error);
    return { data: null, error };
  }

  return { data, error: null };
}
