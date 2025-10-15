'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Announcement {
  id: string;
  tenant_id: string;
  created_by_admin_id: string;
  title: string;
  content: string;
  urgency: 'critical' | 'important' | 'info';
  category: 'event' | 'maintenance' | 'security' | 'policy' | 'general';
  target_audience: 'all_residents' | 'all_security' | 'specific_households' | 'all';
  specific_household_ids: string[] | null;
  effective_start: string;
  effective_end: string | null;
  requires_acknowledgment: boolean;
  attachment_urls: string[] | null;
  created_at: string;
  updated_at: string;
  admin_name?: string;
  acknowledgment_count?: number;
}

export interface AnnouncementStats {
  totalAnnouncements: number;
  activeAnnouncements: number;
  criticalAlerts: number;
  scheduledAnnouncements: number;
}

/**
 * Get all announcements for the current tenant
 */
export async function getAnnouncements(): Promise<Announcement[]> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('announcements')
    .select(`
      id,
      tenant_id,
      created_by_admin_id,
      title,
      content,
      urgency,
      category,
      target_audience,
      specific_household_ids,
      effective_start,
      effective_end,
      requires_acknowledgment,
      attachment_urls,
      created_at,
      updated_at,
      admin:user_profiles!created_by_admin_id(first_name, last_name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch announcements: ${error.message}`);
  }

  // Transform data to include admin name and get acknowledgment counts
  const announcements = await Promise.all(
    (data || []).map(async (announcement: any) => {
      const admin_name = announcement.admin
        ? `${announcement.admin.first_name} ${announcement.admin.last_name}`
        : 'Unknown Admin';

      // Get acknowledgment count
      const { count } = await supabase
        .from('announcement_acknowledgments')
        .select('id', { count: 'exact', head: true })
        .eq('announcement_id', announcement.id);

      return {
        ...announcement,
        admin_name,
        acknowledgment_count: count || 0,
      };
    })
  );

  return announcements;
}

/**
 * Get recent announcements (last 10)
 */
export async function getRecentAnnouncements(): Promise<Announcement[]> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('announcements')
    .select(`
      id,
      tenant_id,
      created_by_admin_id,
      title,
      content,
      urgency,
      category,
      target_audience,
      specific_household_ids,
      effective_start,
      effective_end,
      requires_acknowledgment,
      attachment_urls,
      created_at,
      updated_at,
      admin:user_profiles!created_by_admin_id(first_name, last_name)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(`Failed to fetch recent announcements: ${error.message}`);
  }

  // Transform data to include admin name and get acknowledgment counts
  const announcements = await Promise.all(
    (data || []).map(async (announcement: any) => {
      const admin_name = announcement.admin
        ? `${announcement.admin.first_name} ${announcement.admin.last_name}`
        : 'Unknown Admin';

      // Get acknowledgment count
      const { count } = await supabase
        .from('announcement_acknowledgments')
        .select('id', { count: 'exact', head: true })
        .eq('announcement_id', announcement.id);

      return {
        ...announcement,
        admin_name,
        acknowledgment_count: count || 0,
      };
    })
  );

  return announcements;
}

/**
 * Get announcement statistics
 */
export async function getAnnouncementStats(): Promise<AnnouncementStats> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const now = new Date().toISOString();

  // Total announcements
  const { count: totalAnnouncements } = await supabase
    .from('announcements')
    .select('id', { count: 'exact', head: true });

  // Active announcements (effective_start <= now AND (effective_end IS NULL OR effective_end > now))
  const { count: activeAnnouncements } = await supabase
    .from('announcements')
    .select('id', { count: 'exact', head: true })
    .lte('effective_start', now)
    .or(`effective_end.is.null,effective_end.gt.${now}`);

  // Critical alerts (active + urgency = critical)
  const { count: criticalAlerts } = await supabase
    .from('announcements')
    .select('id', { count: 'exact', head: true })
    .eq('urgency', 'critical')
    .lte('effective_start', now)
    .or(`effective_end.is.null,effective_end.gt.${now}`);

  // Scheduled announcements (effective_start > now)
  const { count: scheduledAnnouncements } = await supabase
    .from('announcements')
    .select('id', { count: 'exact', head: true })
    .gt('effective_start', now);

  return {
    totalAnnouncements: totalAnnouncements || 0,
    activeAnnouncements: activeAnnouncements || 0,
    criticalAlerts: criticalAlerts || 0,
    scheduledAnnouncements: scheduledAnnouncements || 0,
  };
}

/**
 * Get a single announcement by ID
 */
export async function getAnnouncementById(id: string): Promise<Announcement | null> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('announcements')
    .select(`
      id,
      tenant_id,
      created_by_admin_id,
      title,
      content,
      urgency,
      category,
      target_audience,
      specific_household_ids,
      effective_start,
      effective_end,
      requires_acknowledgment,
      attachment_urls,
      created_at,
      updated_at,
      admin:user_profiles!created_by_admin_id(first_name, last_name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch announcement: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const admin_name = data.admin
    ? `${data.admin.first_name} ${data.admin.last_name}`
    : 'Unknown Admin';

  // Get acknowledgment count
  const { count } = await supabase
    .from('announcement_acknowledgments')
    .select('id', { count: 'exact', head: true })
    .eq('announcement_id', data.id);

  return {
    ...data,
    admin_name,
    acknowledgment_count: count || 0,
  };
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete announcement: ${error.message}`);
  }

  revalidatePath('/announcements');
}
