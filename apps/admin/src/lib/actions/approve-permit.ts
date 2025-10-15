'use server';

/**
 * Server action to approve or reject construction permit requests
 * Calls the approve-permit Edge Function and handles the response
 */

import { createClient } from '@/lib/supabase/server';

interface ApprovePermitInput {
  permit_id: string;
  decision: 'approved' | 'rejected';
  road_fee_amount?: number;
  rejection_reason?: string;
}

interface ApprovePermitResult {
  success: boolean;
  permit?: {
    id: string;
    permit_status: string;
    road_fee_amount?: number;
    household_id: string;
    project_type: string;
  };
  error?: string;
}

/**
 * Approve or reject a construction permit request
 */
export async function approvePermitRequest(
  input: ApprovePermitInput
): Promise<ApprovePermitResult> {
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
        error: 'Insufficient permissions. Only admins can approve permits.',
      };
    }

    // Validate input
    if (!input.permit_id || !input.decision) {
      return {
        success: false,
        error: 'Missing required fields: permit_id and decision',
      };
    }

    if (input.decision === 'approved') {
      if (input.road_fee_amount === undefined || input.road_fee_amount < 0) {
        return {
          success: false,
          error: 'Road fee amount is required when approving a permit',
        };
      }
    }

    if (input.decision === 'rejected' && !input.rejection_reason) {
      return {
        success: false,
        error: 'Rejection reason is required when rejecting a permit',
      };
    }

    // Fetch permit information to verify it belongs to this tenant
    const { data: permitData, error: permitError } = await supabase
      .from('construction_permits')
      .select(
        `
        id,
        household_id,
        permit_status,
        household:households (
          id,
          tenant_id
        )
      `
      )
      .eq('id', input.permit_id)
      .single();

    if (permitError || !permitData) {
      return {
        success: false,
        error: 'Failed to fetch permit information',
      };
    }

    // Verify tenant isolation
    if (permitData.household?.tenant_id !== userProfile.tenant_id) {
      return {
        success: false,
        error: 'Permit does not belong to your tenant',
      };
    }

    // Check if permit is already processed
    if (permitData.permit_status !== 'pending_approval') {
      return {
        success: false,
        error: `Permit is already ${permitData.permit_status}. Cannot process again.`,
      };
    }

    // Prepare update data based on decision
    const updateData: any = {
      approved_by_admin_id: user.id,
      approved_at: new Date().toISOString(),
    };

    if (input.decision === 'approved') {
      updateData.permit_status = 'approved';
      updateData.payment_status = input.road_fee_amount && input.road_fee_amount > 0 ? 'pending' : 'paid';
      if (input.road_fee_amount !== undefined) {
        updateData.road_fee_amount = input.road_fee_amount;
      }
    } else {
      updateData.permit_status = 'rejected';
      updateData.rejection_reason = input.rejection_reason || 'No reason provided';
    }

    // Update the permit in the database
    const { data: updatedPermit, error: updateError } = await supabase
      .from('construction_permits')
      .update(updateData)
      .eq('id', input.permit_id)
      .select(`
        id,
        permit_status,
        road_fee_amount,
        household_id,
        project_type,
        approved_at
      `)
      .single();

    if (updateError) {
      console.error('Failed to update permit:', updateError);
      return {
        success: false,
        error: `Failed to ${input.decision} permit: ${updateError.message}`,
      };
    }

    if (!updatedPermit) {
      return {
        success: false,
        error: 'Failed to retrieve updated permit',
      };
    }

    // TODO: Send notification to household head
    // This could be done via email or push notification
    console.log(`Permit ${input.permit_id} ${input.decision} by admin ${user.id}`);

    return {
      success: true,
      permit: updatedPermit,
    };
  } catch (error) {
    console.error('Unexpected error in approvePermitRequest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
    };
  }
}

/**
 * Get all pending construction permit requests for the current tenant
 */
export async function getPendingPermitRequests() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('construction_permits')
      .select(
        `
        id,
        project_type,
        description,
        start_date,
        duration_days,
        contractor_name,
        contractor_license_url,
        num_workers,
        materials_description,
        road_fee_amount,
        payment_status,
        permit_status,
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
      .eq('permit_status', 'pending_approval')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch pending permits:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching pending permits:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}

/**
 * Get all construction permits for a specific household
 */
export async function getHouseholdPermits(householdId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('construction_permits')
      .select(
        `
        id,
        project_type,
        description,
        start_date,
        duration_days,
        contractor_name,
        num_workers,
        road_fee_amount,
        payment_status,
        permit_status,
        created_at,
        approved_by_admin:user_profiles!approved_by_admin_id (
          first_name,
          last_name
        )
      `
      )
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch household permits:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching household permits:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}

/**
 * Get all permits by status for the current tenant
 */
export async function getPermitsByStatus(status?: 'pending_approval' | 'approved' | 'active' | 'on_hold' | 'completed' | 'rejected') {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('construction_permits')
      .select(
        `
        id,
        project_type,
        description,
        start_date,
        duration_days,
        contractor_name,
        contractor_license_url,
        num_workers,
        materials_description,
        road_fee_amount,
        payment_status,
        permit_status,
        rejection_reason,
        created_at,
        approved_at,
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
      query = query.eq('permit_status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch permits:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching permits:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}

/**
 * Get all active/approved permits (approved, active, on_hold - excludes completed)
 */
export async function getActivePermits() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('construction_permits')
      .select(
        `
        id,
        project_type,
        description,
        start_date,
        duration_days,
        contractor_name,
        contractor_license_url,
        num_workers,
        materials_description,
        road_fee_amount,
        payment_status,
        permit_status,
        rejection_reason,
        created_at,
        approved_at,
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
      .in('permit_status', ['approved', 'active', 'on_hold'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch active permits:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching active permits:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}

/**
 * Get permit statistics for the current tenant
 */
export interface PermitStats {
  totalPending: number;
  approved: number;
  rejected: number;
  avgProcessingTime: string;
}

export async function getPermitStats(): Promise<{ data: PermitStats | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Get pending permits count
    const { count: pendingCount, error: pendingError } = await supabase
      .from('construction_permits')
      .select('*', { count: 'exact', head: true })
      .eq('permit_status', 'pending_approval');

    if (pendingError) {
      console.error('Failed to count pending permits:', pendingError);
      return { data: null, error: 'Failed to fetch pending permits count' };
    }

    // Get approved permits count for this month (approved, active, on_hold - excludes completed)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: approvedCount, error: approvedError } = await supabase
      .from('construction_permits')
      .select('*', { count: 'exact', head: true })
      .in('permit_status', ['approved', 'active', 'on_hold'])
      .gte('approved_at', startOfMonth.toISOString());

    if (approvedError) {
      console.error('Failed to count approved permits:', approvedError);
      return { data: null, error: 'Failed to fetch approved permits count' };
    }

    // Get rejected permits count for this month
    const { count: rejectedCount, error: rejectedError } = await supabase
      .from('construction_permits')
      .select('*', { count: 'exact', head: true })
      .eq('permit_status', 'rejected')
      .gte('updated_at', startOfMonth.toISOString());

    if (rejectedError) {
      console.error('Failed to count rejected permits:', rejectedError);
      return { data: null, error: 'Failed to fetch rejected permits count' };
    }

    // Calculate average processing time for approved permits in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: approvedPermits, error: avgError } = await supabase
      .from('construction_permits')
      .select('created_at, approved_at')
      .in('permit_status', ['approved', 'active', 'on_hold'])
      .gte('approved_at', thirtyDaysAgo.toISOString())
      .not('approved_at', 'is', null);

    let avgProcessingTime = 'N/A';
    if (!avgError && approvedPermits && approvedPermits.length > 0) {
      const totalHours = approvedPermits.reduce((sum, permit) => {
        const created = new Date(permit.created_at);
        const approved = new Date(permit.approved_at!);
        const hours = (approved.getTime() - created.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);

      const avgHours = totalHours / approvedPermits.length;

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
    console.error('Unexpected error fetching permit stats:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}
