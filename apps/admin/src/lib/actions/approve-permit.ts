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

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('approve-permit', {
      body: {
        permit_id: input.permit_id,
        admin_id: session.user.id,
        decision: input.decision,
        road_fee_amount: input.road_fee_amount,
        rejection_reason: input.rejection_reason,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      return {
        success: false,
        error: `Failed to ${input.decision === 'approved' ? 'approve' : 'reject'} permit: ${
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
      permit: data.permit,
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
