'use server';

/**
 * Server action to approve or reject vehicle sticker requests
 * Calls the approve-sticker Edge Function and handles the response
 */

import { createClient } from '@/lib/supabase/server';

interface ApproveStickerInput {
  sticker_id: string;
  decision: 'approved' | 'rejected';
  rfid_serial?: string;
  rejection_reason?: string;
}

interface ApproveStickerResult {
  success: boolean;
  sticker?: {
    id: string;
    status: string;
    rfid_serial?: string;
    household_id: string;
    vehicle_plate: string;
  };
  error?: string;
}

/**
 * Approve or reject a vehicle sticker request
 */
export async function approveStickerRequest(
  input: ApproveStickerInput
): Promise<ApproveStickerResult> {
  try {
    const supabase = await createClient();

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Verify admin role
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', session.user.id)
      .single();

    if (profileError || !userProfile) {
      return {
        success: false,
        error: 'Failed to verify user permissions',
      };
    }

    if (!['admin_head', 'admin_officer'].includes(userProfile.role)) {
      return {
        success: false,
        error: 'Insufficient permissions. Only admins can approve stickers.',
      };
    }

    // Validate input
    if (!input.sticker_id || !input.decision) {
      return {
        success: false,
        error: 'Missing required fields: sticker_id and decision',
      };
    }

    if (input.decision === 'approved' && !input.rfid_serial) {
      return {
        success: false,
        error: 'RFID serial is required when approving a sticker',
      };
    }

    // Fetch sticker and household information for allocation validation
    const { data: stickerData, error: stickerError } = await supabase
      .from('vehicle_stickers')
      .select(
        `
        id,
        household_id,
        household:households (
          id,
          sticker_allocation
        )
      `
      )
      .eq('id', input.sticker_id)
      .single();

    if (stickerError || !stickerData) {
      return {
        success: false,
        error: 'Failed to fetch sticker information',
      };
    }

    // Check allocation limit if approving
    if (input.decision === 'approved') {
      // Count currently active stickers for this household
      const { count: activeStickersCount, error: countError } = await supabase
        .from('vehicle_stickers')
        .select('*', { count: 'exact', head: true })
        .eq('household_id', stickerData.household_id)
        .in('status', ['approved', 'issued']);

      if (countError) {
        return {
          success: false,
          error: 'Failed to verify allocation limit',
        };
      }

      const currentCount = activeStickersCount || 0;
      const allocationLimit = stickerData.household?.sticker_allocation || 3;

      // Check if approving this sticker would exceed the limit
      if (currentCount >= allocationLimit) {
        return {
          success: false,
          error: `Cannot approve: Household has reached allocation limit (${currentCount}/${allocationLimit} stickers used). Please override allocation limit or reject this request.`,
        };
      }
    }

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('approve-sticker', {
      body: {
        sticker_id: input.sticker_id,
        decision: input.decision,
        rfid_serial: input.rfid_serial,
        rejection_reason: input.rejection_reason,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      return {
        success: false,
        error: `Failed to ${input.decision === 'approved' ? 'approve' : 'reject'} sticker: ${
          error.message
        }`,
      };
    }

    if (!data || !data.success) {
      return {
        success: false,
        error: data?.error || 'Unknown error occurred',
      };
    }

    return {
      success: true,
      sticker: data.sticker,
    };
  } catch (error) {
    console.error('Unexpected error in approveStickerRequest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
    };
  }
}

/**
 * Get all pending sticker requests for the current tenant
 */
export async function getPendingStickerRequests() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('vehicle_stickers')
      .select(
        `
        id,
        vehicle_plate,
        vehicle_make,
        vehicle_color,
        sticker_type,
        status,
        or_cr_document_url,
        created_at,
        household:households (
          id,
          property:properties (
            id,
            address,
            phase,
            block,
            lot
          ),
          household_head:user_profiles!household_head_id (
            id,
            first_name,
            last_name,
            phone_number
          )
        )
      `
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch pending stickers:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching pending stickers:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}
