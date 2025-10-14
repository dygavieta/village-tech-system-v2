/**
 * Create Household User Edge Function
 *
 * Creates a new household head user with authentication credentials.
 * This function uses the service role to create users with proper metadata.
 *
 * @route POST /functions/v1/create-household-user
 * @auth Required (admin_head or admin_officer only)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger({ function: 'create-household-user' });

interface CreateHouseholdUserRequest {
  email: string;
  password: string;
  tenant_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  phone_number?: string;
}

interface CreateHouseholdUserResponse {
  success: boolean;
  user_id?: string;
  email?: string;
  error?: string;
  details?: string;
}

serve(async (req: Request): Promise<Response> => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.warn('Missing authorization header');
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logger.warn('Invalid authentication', { authError: authError?.message });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify admin role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['admin_head', 'admin_officer'].includes(userProfile.role)) {
      logger.warn('Non-admin attempted household user creation', {
        user_id: user.id,
        role: userProfile?.role
      });
      return new Response(JSON.stringify({
        error: 'Forbidden: Admin access required'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const requestData: CreateHouseholdUserRequest = await req.json();
    logger.info('Household user creation requested', {
      email: requestData.email,
      tenant_id: requestData.tenant_id
    });

    // Verify tenant_id matches admin's tenant
    if (requestData.tenant_id !== userProfile.tenant_id) {
      logger.warn('Tenant mismatch', {
        requested_tenant: requestData.tenant_id,
        admin_tenant: userProfile.tenant_id
      });
      return new Response(JSON.stringify({
        error: 'Forbidden: Cannot create users for different tenant'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields
    if (!requestData.email || !requestData.password || !requestData.tenant_id ||
        !requestData.first_name || !requestData.last_name) {
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        details: 'email, password, tenant_id, first_name, and last_name are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create household head user
    const { data: householdUserData, error: householdUserError } = await supabase.auth.admin.createUser({
      email: requestData.email,
      password: requestData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        tenant_id: requestData.tenant_id,
        role: 'household_head',
        first_name: requestData.first_name,
        middle_name: requestData.middle_name || null,
        last_name: requestData.last_name,
        phone_number: requestData.phone_number || null,
      },
    });

    if (householdUserError || !householdUserData.user) {
      logger.error('Failed to create household user', householdUserError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create household user',
          details: householdUserError?.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    logger.info('Household user created successfully', {
      user_id: householdUserData.user.id,
      email: householdUserData.user.email
    });

    // Return success response
    const response: CreateHouseholdUserResponse = {
      success: true,
      user_id: householdUserData.user.id,
      email: householdUserData.user.email,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Unexpected error during household user creation', error as Error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: (error as Error).message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
