'use server';

/**
 * Create Superadmin Server Action
 *
 * Server action that calls the create-superadmin Edge Function:
 * - Validates input data
 * - Calls Supabase Edge Function
 * - Edge Function generates password and sends email
 * - Handles errors gracefully
 * - Returns result to client
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CreateSuperadminInput {
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  phone_number?: string;
  position?: string;
}

export interface CreateSuperadminResult {
  success: boolean;
  user_id?: string;
  error?: string;
}

/**
 * Validate superadmin creation input
 */
function validateInput(input: CreateSuperadminInput): string | null {
  if (!input.email || !input.email.includes('@')) {
    return 'Valid email is required';
  }

  if (!input.first_name || input.first_name.trim().length < 2) {
    return 'First name must be at least 2 characters';
  }

  if (!input.last_name || input.last_name.trim().length < 2) {
    return 'Last name must be at least 2 characters';
  }

  return null;
}

/**
 * Create a new superadmin user
 */
export async function createSuperadmin(
  input: CreateSuperadminInput
): Promise<CreateSuperadminResult> {
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
    const supabase = await createClient();

    // Get authenticated user (secure method)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Verify superadmin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'superadmin') {
      return {
        success: false,
        error: 'Forbidden: Superadmin access required',
      };
    }

    // Get session for access token (needed for Edge Function auth)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return {
        success: false,
        error: 'Session required',
      };
    }

    // Call Edge Function to create superadmin
    const { data, error } = await supabase.functions.invoke('create-superadmin', {
      body: {
        email: input.email,
        first_name: input.first_name,
        middle_name: input.middle_name,
        last_name: input.last_name,
        phone_number: input.phone_number,
        position: input.position,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create superadmin',
      };
    }

    if (!data || !data.success) {
      return {
        success: false,
        error: data?.error || 'Unknown error occurred',
      };
    }

    // Revalidate superadmins page to show new superadmin
    revalidatePath('/dashboard/superadmins');

    return {
      success: true,
      user_id: data.user_id,
    };
  } catch (error) {
    console.error('Unexpected error in createSuperadmin:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

