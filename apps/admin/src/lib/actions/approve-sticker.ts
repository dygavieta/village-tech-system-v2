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

    // Get the current user (authenticates with Supabase Auth server)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Verify admin role
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
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

    // Prepare update data based on decision
    const updateData: any = {
      approved_at: new Date().toISOString(),
    };

    if (input.decision === 'approved') {
      updateData.status = 'approved';
      if (input.rfid_serial) {
        updateData.rfid_serial = input.rfid_serial.trim();
      }
    } else {
      updateData.status = 'rejected';
      updateData.rejection_reason = input.rejection_reason || 'Rejected by admin';
    }

    // Update the sticker in the database
    const { data: updatedSticker, error: updateError } = await supabase
      .from('vehicle_stickers')
      .update(updateData)
      .eq('id', input.sticker_id)
      .select(`
        id,
        status,
        rfid_serial,
        household_id,
        vehicle_plate,
        approved_at
      `)
      .single();

    if (updateError) {
      console.error('Failed to update sticker:', updateError);
      return {
        success: false,
        error: `Failed to ${input.decision} sticker: ${updateError.message}`,
      };
    }

    if (!updatedSticker) {
      return {
        success: false,
        error: 'Failed to retrieve updated sticker',
      };
    }

    // TODO: Send notification to household head
    // This could be done via email or push notification
    console.log(`Sticker ${input.sticker_id} ${input.decision} by admin ${user.id}`);

    return {
      success: true,
      sticker: updatedSticker,
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

/**
 * Get all stickers by status for the current tenant
 */
export async function getStickersByStatus(status?: 'pending' | 'approved' | 'rejected' | 'issued' | 'ready_for_pickup' | 'expired' | 'lost' | 'deactivated') {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('vehicle_stickers')
      .select(
        `
        id,
        vehicle_plate,
        vehicle_make,
        vehicle_color,
        sticker_type,
        status,
        rfid_serial,
        or_cr_document_url,
        created_at,
        approved_at,
        rejection_reason,
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
      );

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch stickers:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching stickers:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}

/**
 * Get all approved/issued stickers (active stickers)
 */
export async function getActiveStickers() {
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
        rfid_serial,
        or_cr_document_url,
        created_at,
        approved_at,
        rejection_reason,
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
      .in('status', ['approved', 'ready_for_pickup', 'issued'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch active stickers:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching active stickers:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}

/**
 * Get sticker statistics for the current tenant
 */
export interface StickerStats {
  totalPending: number;
  approved: number;
  rejected: number;
  avgProcessingTime: string;
}

export async function getStickerStats(): Promise<{ data: StickerStats | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Get pending stickers count
    const { count: pendingCount, error: pendingError } = await supabase
      .from('vehicle_stickers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingError) {
      console.error('Failed to count pending stickers:', pendingError);
      return { data: null, error: 'Failed to fetch pending stickers count' };
    }

    // Get approved stickers count for this month (approved, ready_for_pickup, issued)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: approvedCount, error: approvedError } = await supabase
      .from('vehicle_stickers')
      .select('*', { count: 'exact', head: true })
      .in('status', ['approved', 'ready_for_pickup', 'issued'])
      .gte('approved_at', startOfMonth.toISOString());

    if (approvedError) {
      console.error('Failed to count approved stickers:', approvedError);
      return { data: null, error: 'Failed to fetch approved stickers count' };
    }

    // Get rejected stickers count for this month
    const { count: rejectedCount, error: rejectedError } = await supabase
      .from('vehicle_stickers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected')
      .gte('updated_at', startOfMonth.toISOString());

    if (rejectedError) {
      console.error('Failed to count rejected stickers:', rejectedError);
      return { data: null, error: 'Failed to fetch rejected stickers count' };
    }

    // Calculate average processing time for approved stickers in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: approvedStickers, error: avgError } = await supabase
      .from('vehicle_stickers')
      .select('created_at, approved_at')
      .in('status', ['approved', 'ready_for_pickup', 'issued'])
      .gte('approved_at', thirtyDaysAgo.toISOString())
      .not('approved_at', 'is', null);

    let avgProcessingTime = 'N/A';
    if (!avgError && approvedStickers && approvedStickers.length > 0) {
      const totalHours = approvedStickers.reduce((sum, sticker) => {
        const created = new Date(sticker.created_at);
        const approved = new Date(sticker.approved_at!);
        const hours = (approved.getTime() - created.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);

      const avgHours = totalHours / approvedStickers.length;

      if (avgHours < 24) {
        avgProcessingTime = `${avgHours.toFixed(1)} hours`;
      } else {
        avgProcessingTime = `${(avgHours / 24).toFixed(1)} days`;
      }
    }

    return {
      data: {
        totalPending: pendingCount || 0,
        approved: approvedCount || 0,
        rejected: rejectedCount || 0,
        avgProcessingTime,
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching sticker stats:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}
