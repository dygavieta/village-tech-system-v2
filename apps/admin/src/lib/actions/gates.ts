'use server';

import { createClient } from '@/lib/supabase/server';

export interface Gate {
  id: string;
  tenant_id: string;
  name: string;
  gate_type: 'primary' | 'secondary' | 'service' | 'emergency';
  status: 'active' | 'inactive' | 'maintenance';
  operating_hours_start: string | null;
  operating_hours_end: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  rfid_reader_serial: string | null;
  created_at: string;
  updated_at: string;
  scans_today?: number;
  last_scan?: string | null;
}

export interface GateStats {
  totalGates: number;
  activeGates: number;
  inactiveGates: number;
  maintenanceGates: number;
  totalScansToday: number;
}

/**
 * Get all gates for the current tenant
 */
export async function getGates(): Promise<Gate[]> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('gates')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch gates: ${error.message}`);
  }

  // Get today's scans for each gate
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const gatesWithStats = await Promise.all(
    (data || []).map(async (gate) => {
      // Get scan count for today
      const { count: scansToday } = await supabase
        .from('entry_exit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('gate_id', gate.id)
        .gte('timestamp', today.toISOString());

      // Get last scan timestamp
      const { data: lastScanData } = await supabase
        .from('entry_exit_logs')
        .select('timestamp')
        .eq('gate_id', gate.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      return {
        ...gate,
        scans_today: scansToday || 0,
        last_scan: lastScanData?.timestamp || null,
      };
    })
  );

  return gatesWithStats;
}

/**
 * Get gate statistics for the current tenant
 */
export async function getGateStats(): Promise<GateStats> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  // Total gates
  const { count: totalGates } = await supabase
    .from('gates')
    .select('id', { count: 'exact', head: true });

  // Active gates
  const { count: activeGates } = await supabase
    .from('gates')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  // Inactive gates
  const { count: inactiveGates } = await supabase
    .from('gates')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'inactive');

  // Maintenance gates
  const { count: maintenanceGates } = await supabase
    .from('gates')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'maintenance');

  // Total scans today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: totalScansToday } = await supabase
    .from('entry_exit_logs')
    .select('id', { count: 'exact', head: true })
    .gte('timestamp', today.toISOString());

  return {
    totalGates: totalGates || 0,
    activeGates: activeGates || 0,
    inactiveGates: inactiveGates || 0,
    maintenanceGates: maintenanceGates || 0,
    totalScansToday: totalScansToday || 0,
  };
}

/**
 * Get a single gate by ID
 */
export async function getGateById(id: string): Promise<Gate | null> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('gates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch gate: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // Get today's scans
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: scansToday } = await supabase
    .from('entry_exit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('gate_id', data.id)
    .gte('timestamp', today.toISOString());

  // Get last scan timestamp
  const { data: lastScanData } = await supabase
    .from('entry_exit_logs')
    .select('timestamp')
    .eq('gate_id', data.id)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  return {
    ...data,
    scans_today: scansToday || 0,
    last_scan: lastScanData?.timestamp || null,
  };
}

export interface CreateGateInput {
  name: string;
  gate_type: 'primary' | 'secondary' | 'service' | 'emergency';
  status: 'active' | 'inactive' | 'maintenance';
  operating_hours_start?: string;
  operating_hours_end?: string;
  gps_lat?: number;
  gps_lng?: number;
  rfid_reader_serial?: string;
}

/**
 * Create a new gate
 */
export async function createGate(input: CreateGateInput): Promise<Gate> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  // Get tenant_id from the user's JWT
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No valid session');
  }

  const base64Payload = session.access_token.split('.')[1];
  const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
  const tenantId = payload.tenant_id;

  if (!tenantId) {
    throw new Error('No tenant_id found in session');
  }

  const { data, error } = await supabase
    .from('gates')
    .insert([{ ...input, tenant_id: tenantId }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create gate: ${error.message}`);
  }

  return {
    ...data,
    scans_today: 0,
    last_scan: null,
  };
}

/**
 * Update an existing gate
 */
export async function updateGate(id: string, input: Partial<CreateGateInput>): Promise<Gate> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('gates')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update gate: ${error.message}`);
  }

  return {
    ...data,
    scans_today: 0,
    last_scan: null,
  };
}

/**
 * Delete a gate
 */
export async function deleteGate(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('gates')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete gate: ${error.message}`);
  }
}
