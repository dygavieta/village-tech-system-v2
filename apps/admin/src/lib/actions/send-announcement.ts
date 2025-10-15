'use server';

/**
 * T149: Send Announcement Server Action
 * Creates announcement and triggers Edge Function for notifications
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAnnouncementSchema } from '@/lib/validations/schemas';

export interface SendAnnouncementResult {
  success: boolean;
  announcementId?: string;
  error?: string;
}

export async function sendAnnouncement(
  data: unknown
): Promise<SendAnnouncementResult> {
  try {
    // Validate input
    const validatedData = createAnnouncementSchema.parse(data);

    // Get Supabase client
    const supabase = await createClient();

    // Get current user and tenant
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Get user's tenant_id and role from user_profiles table
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return { success: false, error: `Failed to fetch user profile: ${profileError.message}` };
    }

    if (!profile) {
      return { success: false, error: 'User profile not found' };
    }

    const tenantId = profile.tenant_id;
    const userRole = profile.role;

    if (!tenantId) {
      return { success: false, error: 'Tenant ID not found' };
    }

    // Check if user is admin
    if (!userRole || !['admin_head', 'admin_officer'].includes(userRole)) {
      return { success: false, error: `Unauthorized: Admin access required (current role: ${userRole})` };
    }

    // Insert announcement
    const { data: announcement, error: insertError } = await supabase
      .from('announcements')
      .insert({
        tenant_id: tenantId,
        created_by_admin_id: user.id,
        title: validatedData.title,
        content: validatedData.content,
        urgency: validatedData.urgency,
        category: validatedData.category,
        target_audience: validatedData.target_audience,
        specific_household_ids: validatedData.specific_household_ids || null,
        effective_start: validatedData.effective_start
          ? new Date(validatedData.effective_start).toISOString()
          : new Date().toISOString(),
        effective_end: validatedData.effective_end
          ? new Date(validatedData.effective_end).toISOString()
          : null,
        requires_acknowledgment: validatedData.requires_acknowledgment,
        attachment_urls: validatedData.attachment_urls || null,
      })
      .select('id')
      .single();

    if (insertError) {
      return {
        success: false,
        error: `Failed to create announcement: ${insertError.message || insertError.code || 'Unknown error'}`
      };
    }

    // TODO: Call Edge Function to send push notifications
    // This would be implemented in a separate Edge Function
    // Example: await supabase.functions.invoke('send-announcement-notifications', {
    //   body: { announcement_id: announcement.id }
    // });

    // Revalidate announcements page
    revalidatePath('/announcements');

    return {
      success: true,
      announcementId: announcement.id,
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as any;
      const firstIssue = zodError.issues?.[0];
      return {
        success: false,
        error: firstIssue ? `Validation error: ${firstIssue.message} (${firstIssue.path.join('.')})` : 'Validation failed',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Acknowledge an announcement (for residents/security)
 */
export async function acknowledgeAnnouncement(
  announcementId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Insert acknowledgment (will fail if already acknowledged due to unique constraint)
    const { error: insertError } = await supabase
      .from('announcement_acknowledgments')
      .insert({
        announcement_id: announcementId,
        user_id: user.id,
      });

    if (insertError) {
      // Check if it's a duplicate error (already acknowledged)
      if (insertError.code === '23505') {
        return { success: true }; // Already acknowledged, that's fine
      }
      console.error('Error acknowledging announcement:', insertError);
      return { success: false, error: 'Failed to acknowledge announcement' };
    }

    revalidatePath(`/announcements/${announcementId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in acknowledgeAnnouncement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Get announcement stats for admin dashboard
 */
export async function getAnnouncementStats() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Authentication required');
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Get total announcements
    const { count: totalCount } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id);

    // Get active announcements (not expired)
    const { count: activeCount } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id)
      .or('effective_end.is.null,effective_end.gt.' + new Date().toISOString());

    // Get critical alerts
    const { count: criticalCount } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id)
      .eq('urgency', 'critical')
      .or('effective_end.is.null,effective_end.gt.' + new Date().toISOString());

    // Get scheduled announcements (future start date)
    const { count: scheduledCount } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id)
      .gt('effective_start', new Date().toISOString());

    return {
      totalAnnouncements: totalCount || 0,
      activeAnnouncements: activeCount || 0,
      criticalAlerts: criticalCount || 0,
      scheduledAnnouncements: scheduledCount || 0,
    };
  } catch (error) {
    console.error('Error getting announcement stats:', error);
    return {
      totalAnnouncements: 0,
      activeAnnouncements: 0,
      criticalAlerts: 0,
      scheduledAnnouncements: 0,
    };
  }
}
