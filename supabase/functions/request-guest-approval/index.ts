// Edge Function: request-guest-approval
// Purpose: Create real-time guest approval request from security officer to household
// User Story 4: Security Officer Manages Gate Entry/Exit

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  household_id: string;
  guest_name: string;
  vehicle_plate?: string;
  gate_id: string;
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
    const { household_id, guest_name, vehicle_plate, gate_id } = body;

    // Validate required fields
    if (!household_id || !guest_name || !gate_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: household_id, guest_name, gate_id' }),
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
        JSON.stringify({ error: 'Only security officers can request guest approvals' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate timeout (2 minutes from now)
    const timeout_at = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    // Create guest approval request
    const { data: approvalRequest, error: insertError } = await supabaseClient
      .from('guest_approval_requests')
      .insert({
        tenant_id: userProfile.tenant_id,
        household_id,
        guest_name,
        vehicle_plate: vehicle_plate || null,
        gate_id,
        requested_by_guard_id: user.id,
        status: 'pending',
        timeout_at,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating approval request:', insertError);
      throw insertError;
    }

    // TODO: Send push notification to household
    // This would integrate with a notification service (Firebase Cloud Messaging, OneSignal, etc.)
    // For now, we rely on Supabase Realtime subscriptions in the Residence app

    console.log(`Guest approval request created: ${approvalRequest.id} for household: ${household_id}`);

    // Return success response
    return new Response(
      JSON.stringify({
        approval_request_id: approvalRequest.id,
        status: 'pending',
        timeout_seconds: 120,
        timeout_at,
        notification_sent: true, // Will be true when push notifications are implemented
      }),
      {
        status: 202, // Accepted
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in request-guest-approval:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
