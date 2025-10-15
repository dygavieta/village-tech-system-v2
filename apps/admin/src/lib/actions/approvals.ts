'use server';

/**
 * Server actions for fetching approval-related data
 * Provides aggregated statistics and combined approval lists
 */

import { createClient } from '@/lib/supabase/server';

export interface ApprovalStats {
  totalPending: number;
  stickerRequests: number;
  permitRequests: number;
  avgResponseTime: string;
}

export interface ApprovalItem {
  id: string;
  type: 'sticker' | 'permit';
  title: string;
  household: string;
  details: string;
  submittedAt: string;
  priority: 'high' | 'normal';
  createdAt: Date;
}

/**
 * Get approval statistics for the current tenant
 */
export async function getApprovalStats(): Promise<{ data: ApprovalStats | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Get pending sticker count
    const { count: stickerCount, error: stickerError } = await supabase
      .from('vehicle_stickers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (stickerError) {
      console.error('Failed to count pending stickers:', stickerError);
      return { data: null, error: 'Failed to fetch sticker count' };
    }

    // Get pending permit count
    const { count: permitCount, error: permitError } = await supabase
      .from('construction_permits')
      .select('*', { count: 'exact', head: true })
      .eq('permit_status', 'pending_approval');

    if (permitError) {
      console.error('Failed to count pending permits:', permitError);
      return { data: null, error: 'Failed to fetch permit count' };
    }

    // Calculate average response time for stickers (approved in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: approvedStickers, error: avgError } = await supabase
      .from('vehicle_stickers')
      .select('created_at, approved_at')
      .eq('status', 'approved')
      .gte('approved_at', thirtyDaysAgo.toISOString())
      .not('approved_at', 'is', null);

    let avgResponseTime = 'N/A';
    if (!avgError && approvedStickers && approvedStickers.length > 0) {
      const totalHours = approvedStickers.reduce((sum, sticker) => {
        const created = new Date(sticker.created_at);
        const approved = new Date(sticker.approved_at!);
        const hours = (approved.getTime() - created.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);

      const avgHours = totalHours / approvedStickers.length;

      if (avgHours < 24) {
        avgResponseTime = `${avgHours.toFixed(1)} hours`;
      } else {
        avgResponseTime = `${(avgHours / 24).toFixed(1)} days`;
      }
    }

    return {
      data: {
        totalPending: (stickerCount || 0) + (permitCount || 0),
        stickerRequests: stickerCount || 0,
        permitRequests: permitCount || 0,
        avgResponseTime,
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching approval stats:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}

/**
 * Get recent pending approvals (combined stickers and permits)
 */
export async function getRecentPendingApprovals(limit: number = 10): Promise<{ data: ApprovalItem[] | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Fetch pending stickers
    const { data: stickers, error: stickerError } = await supabase
      .from('vehicle_stickers')
      .select(
        `
        id,
        vehicle_plate,
        vehicle_make,
        vehicle_color,
        created_at,
        household:households (
          id,
          property:properties (
            address,
            block,
            lot
          ),
          household_head:user_profiles!household_head_id (
            first_name,
            last_name
          )
        )
      `
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (stickerError) {
      console.error('Failed to fetch pending stickers:', stickerError);
      return { data: null, error: 'Failed to fetch sticker requests' };
    }

    // Fetch pending permits
    const { data: permits, error: permitError } = await supabase
      .from('construction_permits')
      .select(
        `
        id,
        project_type,
        duration_days,
        created_at,
        household:households (
          id,
          property:properties (
            address,
            block,
            lot
          ),
          household_head:user_profiles!household_head_id (
            first_name,
            last_name
          )
        )
      `
      )
      .eq('permit_status', 'pending_approval')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (permitError) {
      console.error('Failed to fetch pending permits:', permitError);
      return { data: null, error: 'Failed to fetch permit requests' };
    }

    // Transform stickers to ApprovalItem format
    const stickerItems: ApprovalItem[] = (stickers || []).map((sticker: any) => {
      const household = sticker.household;
      const property = household?.property;
      const head = household?.household_head;

      const householdName = property?.block && property?.lot
        ? `Block ${property.block} Lot ${property.lot} - ${head?.first_name || ''} ${head?.last_name || ''}`.trim()
        : `${head?.first_name || ''} ${head?.last_name || ''}`.trim() || 'Unknown Household';

      const createdAt = new Date(sticker.created_at);
      const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

      let submittedAt: string;
      if (hoursAgo < 1) {
        submittedAt = `${Math.floor(hoursAgo * 60)} minutes ago`;
      } else if (hoursAgo < 24) {
        submittedAt = `${Math.floor(hoursAgo)} hours ago`;
      } else {
        submittedAt = `${Math.floor(hoursAgo / 24)} days ago`;
      }

      return {
        id: sticker.id,
        type: 'sticker' as const,
        title: 'Vehicle Sticker Request',
        household: householdName,
        details: `${sticker.vehicle_make || 'Unknown'} ${sticker.vehicle_color || ''} - ${sticker.vehicle_plate || 'No Plate'}`.trim(),
        submittedAt,
        priority: 'normal' as const,
        createdAt,
      };
    });

    // Transform permits to ApprovalItem format
    const permitItems: ApprovalItem[] = (permits || []).map((permit: any) => {
      const household = permit.household;
      const property = household?.property;
      const head = household?.household_head;

      const householdName = property?.block && property?.lot
        ? `Block ${property.block} Lot ${property.lot} - ${head?.first_name || ''} ${head?.last_name || ''}`.trim()
        : `${head?.first_name || ''} ${head?.last_name || ''}`.trim() || 'Unknown Household';

      const createdAt = new Date(permit.created_at);
      const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

      let submittedAt: string;
      if (hoursAgo < 1) {
        submittedAt = `${Math.floor(hoursAgo * 60)} minutes ago`;
      } else if (hoursAgo < 24) {
        submittedAt = `${Math.floor(hoursAgo)} hours ago`;
      } else {
        submittedAt = `${Math.floor(hoursAgo / 24)} days ago`;
      }

      // Mark permits as high priority if they're older than 2 days
      const priority = hoursAgo > 48 ? 'high' : 'normal';

      return {
        id: permit.id,
        type: 'permit' as const,
        title: 'Construction Permit',
        household: householdName,
        details: `${permit.project_type || 'Construction'} - ${permit.duration_days || 0} days`,
        submittedAt,
        priority: priority as 'high' | 'normal',
        createdAt,
      };
    });

    // Combine and sort by creation date (most recent first)
    const combined = [...stickerItems, ...permitItems].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    // Return only the requested limit
    return {
      data: combined.slice(0, limit),
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching recent approvals:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}
