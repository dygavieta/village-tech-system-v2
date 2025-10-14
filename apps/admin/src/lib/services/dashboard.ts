'use server';

/**
 * Dashboard service
 * Handles all data fetching and business logic for the admin dashboard
 */

import { createClient } from '@/lib/supabase/server';

// Types for dashboard data
export interface DashboardStats {
  totalHouseholds: number;
  pendingStickers: number;
  pendingPermits: number;
  activePermits: number;
  totalAnnouncements: number;
  todayGateActivity: number;
  overdueFeesCount: number;
}

export interface RecentActivityItem {
  id: string;
  type: 'sticker_request' | 'permit_request' | 'household_registered' | 'announcement';
  title: string;
  household: string;
  time: string;
  status: string;
  timestamp: Date;
}

interface VehicleStickerData {
  id: string;
  created_at: string;
  vehicle_plate: string;
  status: string;
  household: {
    property: {
      address: string;
    } | null;
  } | null;
}

interface ConstructionPermitData {
  id: string;
  created_at: string;
  project_type: string;
  permit_status: string;
  household: {
    property: {
      address: string;
    } | null;
  } | null;
}

interface HouseholdData {
  id: string;
  created_at: string;
  property: {
    address: string;
  } | null;
}

interface AnnouncementData {
  id: string;
  created_at: string;
  title: string;
  urgency: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: RecentActivityItem[];
  error?: string;
}

/**
 * Fetch all dashboard statistics in parallel
 */
async function fetchDashboardStats(supabase: any): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Run all count queries in parallel for better performance
  const [
    householdsResult,
    stickersResult,
    pendingPermitsResult,
    activePermitsResult,
    announcementsResult,
    gateActivityResult,
    overdueFeesResult,
  ] = await Promise.all([
    supabase.from('households').select('*', { count: 'exact', head: true }),
    supabase.from('vehicle_stickers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('construction_permits').select('*', { count: 'exact', head: true }).eq('permit_status', 'pending_approval'),
    supabase.from('construction_permits').select('*', { count: 'exact', head: true }).in('permit_status', ['approved', 'active']),
    supabase.from('announcements').select('*', { count: 'exact', head: true }),
    supabase.from('entry_exit_logs').select('*', { count: 'exact', head: true }).gte('timestamp', today.toISOString()),
    supabase.from('association_fees').select('*', { count: 'exact', head: true }).eq('payment_status', 'overdue'),
  ]);

  return {
    totalHouseholds: householdsResult.count || 0,
    pendingStickers: stickersResult.count || 0,
    pendingPermits: pendingPermitsResult.count || 0,
    activePermits: activePermitsResult.count || 0,
    totalAnnouncements: announcementsResult.count || 0,
    todayGateActivity: gateActivityResult.count || 0,
    overdueFeesCount: overdueFeesResult.count || 0,
  };
}

/**
 * Fetch recent activity from the last 24 hours
 */
async function fetchRecentActivity(supabase: any): Promise<RecentActivityItem[]> {
  const last24Hours = new Date();
  last24Hours.setHours(last24Hours.getHours() - 24);

  // Fetch recent items in parallel
  const [stickersResult, permitsResult, householdsResult, announcementsResult] = await Promise.all([
    supabase
      .from('vehicle_stickers')
      .select(
        `
        id,
        created_at,
        vehicle_plate,
        status,
        household:households (
          property:properties (
            address
          )
        )
      `
      )
      .gte('created_at', last24Hours.toISOString())
      .order('created_at', { ascending: false })
      .limit(2),
    supabase
      .from('construction_permits')
      .select(
        `
        id,
        created_at,
        project_type,
        permit_status,
        household:households (
          property:properties (
            address
          )
        )
      `
      )
      .gte('created_at', last24Hours.toISOString())
      .order('created_at', { ascending: false })
      .limit(2),
    supabase
      .from('households')
      .select(
        `
        id,
        created_at,
        property:properties (
          address
        )
      `
      )
      .gte('created_at', last24Hours.toISOString())
      .order('created_at', { ascending: false })
      .limit(2),
    supabase
      .from('announcements')
      .select(
        `
        id,
        created_at,
        title,
        urgency
      `
      )
      .gte('created_at', last24Hours.toISOString())
      .order('created_at', { ascending: false })
      .limit(2),
  ]);

  const recentStickers: VehicleStickerData[] = stickersResult.data || [];
  const recentPermits: ConstructionPermitData[] = permitsResult.data || [];
  const recentHouseholds: HouseholdData[] = householdsResult.data || [];
  const recentAnnouncements: AnnouncementData[] = announcementsResult.data || [];

  // Combine and transform all activity items
  const activities: RecentActivityItem[] = [
    ...recentStickers.map((s) => ({
      id: `sticker-${s.id}`,
      type: 'sticker_request' as const,
      title: 'New vehicle sticker request',
      household: s.household?.property?.address || 'Unknown',
      time: formatTimeAgo(new Date(s.created_at)),
      status: s.status,
      timestamp: new Date(s.created_at),
    })),
    ...recentPermits.map((p) => ({
      id: `permit-${p.id}`,
      type: 'permit_request' as const,
      title: `${capitalize(p.project_type)} permit application`,
      household: p.household?.property?.address || 'Unknown',
      time: formatTimeAgo(new Date(p.created_at)),
      status: p.permit_status === 'pending_approval' ? 'pending' : 'completed',
      timestamp: new Date(p.created_at),
    })),
    ...recentHouseholds.map((h) => ({
      id: `household-${h.id}`,
      type: 'household_registered' as const,
      title: 'New household registered',
      household: h.property?.address || 'Unknown',
      time: formatTimeAgo(new Date(h.created_at)),
      status: 'completed' as const,
      timestamp: new Date(h.created_at),
    })),
    ...recentAnnouncements.map((a) => ({
      id: `announcement-${a.id}`,
      type: 'announcement' as const,
      title: a.title,
      household: 'All residents',
      time: formatTimeAgo(new Date(a.created_at)),
      status: 'completed' as const,
      timestamp: new Date(a.created_at),
    })),
  ];

  // Sort by timestamp and return top 4
  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 4);
}

/**
 * Main function to get all dashboard data
 * Fetches stats and recent activity in parallel
 */
export async function getDashboardData(): Promise<DashboardData> {
  try {
    const supabase = await createClient();

    // Fetch stats and activity in parallel
    const [stats, recentActivity] = await Promise.all([
      fetchDashboardStats(supabase),
      fetchRecentActivity(supabase),
    ]);

    return {
      stats,
      recentActivity,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      stats: {
        totalHouseholds: 0,
        pendingStickers: 0,
        pendingPermits: 0,
        activePermits: 0,
        totalAnnouncements: 0,
        todayGateActivity: 0,
        overdueFeesCount: 0,
      },
      recentActivity: [],
      error: error instanceof Error ? error.message : 'Failed to load dashboard data',
    };
  }
}

// Helper functions
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

  return date.toLocaleDateString();
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
