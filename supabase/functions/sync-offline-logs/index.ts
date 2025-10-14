// Edge Function: sync-offline-logs
// Purpose: Batch sync entry/exit logs from Sentinel app when connectivity is restored
// User Story 4: Security Officer Manages Gate Entry/Exit (Offline Support)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EntryExitLog {
  gate_id: string;
  entry_type: 'resident' | 'guest' | 'delivery' | 'construction_worker' | 'emergency';
  direction: 'entry' | 'exit';
  timestamp: string;
  sticker_id?: string;
  guest_id?: string;
  permit_id?: string;
  guard_on_duty_id?: string;
  vehicle_plate?: string;
  purpose?: string;
  notes?: string;
  // Client-side generated ID for deduplication
  client_id?: string;
}

interface RequestBody {
  logs: EntryExitLog[];
}

interface SyncResult {
  total: number;
  inserted: number;
  duplicates: number;
  errors: number;
  error_details?: Array<{ log: EntryExitLog; error: string }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { logs } = body;

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'logs array is required and cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get tenant_id from user profile
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      throw new Error('User profile not found');
    }

    // Verify user is a security officer
    if (!['security_head', 'security_officer'].includes(userProfile.role)) {
      return new Response(
        JSON.stringify({ error: 'Only security officers can sync offline logs' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result: SyncResult = {
      total: logs.length,
      inserted: 0,
      duplicates: 0,
      errors: 0,
      error_details: [],
    };

    // Process logs in batches (Supabase has a limit of ~1000 rows per insert)
    const batchSize = 500;
    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = logs.slice(i, i + batchSize);

      // Prepare logs with tenant_id
      const logsToInsert = batch.map(log => ({
        tenant_id: userProfile.tenant_id,
        gate_id: log.gate_id,
        entry_type: log.entry_type,
        direction: log.direction,
        timestamp: log.timestamp,
        sticker_id: log.sticker_id || null,
        guest_id: log.guest_id || null,
        permit_id: log.permit_id || null,
        guard_on_duty_id: log.guard_on_duty_id || user.id, // Default to current user if not specified
        vehicle_plate: log.vehicle_plate || null,
        purpose: log.purpose || null,
        notes: log.notes || null,
      }));

      // Check for duplicates based on timestamp, gate_id, and vehicle_plate
      // This is a simple deduplication strategy - enhance as needed
      const timestamps = logsToInsert.map(l => l.timestamp);
      const { data: existingLogs } = await supabaseClient
        .from('entry_exit_logs')
        .select('timestamp, gate_id, vehicle_plate')
        .in('timestamp', timestamps)
        .eq('tenant_id', userProfile.tenant_id);

      // Filter out duplicates
      const existingSet = new Set(
        (existingLogs || []).map(l => `${l.timestamp}:${l.gate_id}:${l.vehicle_plate}`)
      );

      const uniqueLogs = logsToInsert.filter(log => {
        const key = `${log.timestamp}:${log.gate_id}:${log.vehicle_plate}`;
        if (existingSet.has(key)) {
          result.duplicates++;
          return false;
        }
        return true;
      });

      // Insert unique logs
      if (uniqueLogs.length > 0) {
        const { data, error: insertError } = await supabaseClient
          .from('entry_exit_logs')
          .insert(uniqueLogs)
          .select();

        if (insertError) {
          console.error('Error inserting logs batch:', insertError);
          result.errors += uniqueLogs.length;
          result.error_details?.push({
            log: batch[0], // First log of batch as representative
            error: insertError.message,
          });
        } else {
          result.inserted += data?.length || 0;
        }
      }
    }

    console.log(`Sync completed: ${result.inserted} inserted, ${result.duplicates} duplicates, ${result.errors} errors`);

    // Return sync result
    return new Response(
      JSON.stringify({
        success: result.errors === 0,
        ...result,
      }),
      {
        status: result.errors > 0 ? 207 : 200, // 207 Multi-Status for partial success
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in sync-offline-logs:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
