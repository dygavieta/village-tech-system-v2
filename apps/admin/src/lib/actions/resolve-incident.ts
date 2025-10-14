'use server';

/**
 * T158: Resolve Incident Server Action
 * Resolves security incidents and updates their status
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const resolveIncidentSchema = z.object({
  incident_id: z.string().uuid(),
  resolution_notes: z.string().min(10, 'Resolution notes must be at least 10 characters'),
  status: z.enum(['resolved', 'dismissed']).default('resolved'),
});

export interface ResolveIncidentResult {
  success: boolean;
  error?: string;
}

export async function resolveIncident(
  data: unknown
): Promise<ResolveIncidentResult> {
  try {
    // Validate input
    const validatedData = resolveIncidentSchema.parse(data);

    // Get Supabase client
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Get user's profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('tenant_id, user_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'User profile not found' };
    }

    // Check if user is admin
    if (!['admin_head', 'admin_officer'].includes(profile.user_role)) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // Update incident
    const { error: updateError } = await supabase
      .from('incidents')
      .update({
        status: validatedData.status,
        resolution_notes: validatedData.resolution_notes,
        resolved_by_admin_id: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', validatedData.incident_id)
      .eq('tenant_id', profile.tenant_id);

    if (updateError) {
      console.error('Error resolving incident:', updateError);
      return { success: false, error: 'Failed to resolve incident' };
    }

    // Revalidate incidents pages
    revalidatePath('/monitoring/incidents');
    revalidatePath(`/monitoring/incidents/${validatedData.incident_id}`);

    return { success: true };
  } catch (error) {
    console.error('Error in resolveIncident:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Update incident status (for responding, etc.)
 */
export async function updateIncidentStatus(
  incidentId: string,
  status: 'reported' | 'responding' | 'resolved'
): Promise<ResolveIncidentResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id, user_role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return { success: false, error: 'User profile not found' };
    }

    // Check authorization
    if (!['admin_head', 'admin_officer', 'security_head', 'security_officer'].includes(profile.user_role)) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error: updateError } = await supabase
      .from('incidents')
      .update({ status })
      .eq('id', incidentId)
      .eq('tenant_id', profile.tenant_id);

    if (updateError) {
      console.error('Error updating incident status:', updateError);
      return { success: false, error: 'Failed to update incident status' };
    }

    revalidatePath('/monitoring/incidents');
    revalidatePath(`/monitoring/incidents/${incidentId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in updateIncidentStatus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Get incident statistics for dashboard
 */
export async function getIncidentStats() {
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

    // Get active incidents
    const { count: activeCount } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id)
      .in('status', ['reported', 'responding']);

    // Get resolved today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: resolvedTodayCount } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id)
      .eq('status', 'resolved')
      .gte('resolved_at', todayStart.toISOString());

    // Get total this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: monthCount } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id)
      .gte('created_at', monthStart.toISOString());

    // Get average response time (simplified - would need more complex query in production)
    const avgResponseTime = '8 minutes'; // Placeholder

    return {
      activeIncidents: activeCount || 0,
      resolvedToday: resolvedTodayCount || 0,
      totalThisMonth: monthCount || 0,
      avgResponseTime,
    };
  } catch (error) {
    console.error('Error getting incident stats:', error);
    return {
      activeIncidents: 0,
      resolvedToday: 0,
      totalThisMonth: 0,
      avgResponseTime: '0 minutes',
    };
  }
}
