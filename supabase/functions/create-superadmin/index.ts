/**
 * Create Superadmin Edge Function
 *
 * Creates a new superadmin user with full platform access:
 * - User creation via Supabase Admin API
 * - User profile with superadmin role
 * - Email notification with credentials
 *
 * @route POST /functions/v1/create-superadmin
 * @auth Required (superadmin only)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../_shared/logger.ts';
import { generateSuperadminInvitationEmail } from '../_shared/email-templates.ts';
import { sendEmail } from '../_shared/email.ts';

const logger = createLogger({ function: 'create-superadmin' });

interface CreateSuperadminRequest {
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  phone_number?: string;
  position?: string;
}

/**
 * Generate a secure random password
 */
function generatePassword(length = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => charset[byte % charset.length]).join('');
}

interface CreateSuperadminResponse {
  success: boolean;
  user_id?: string;
  error?: string;
}

serve(async (req: Request): Promise<Response> => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.warn('Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is superadmin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: callerError } = await supabase.auth.getUser(token);

    if (callerError || !callerUser) {
      logger.warn('Invalid token');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify caller is superadmin
    const { data: callerProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single();

    if (profileError || callerProfile?.role !== 'superadmin') {
      logger.warn(`Unauthorized access attempt by user ${callerUser.id}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Superadmin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const requestData: CreateSuperadminRequest = await req.json();
    logger.info('Creating superadmin', { email: requestData.email });

    // Validate required fields
    if (!requestData.email || !requestData.first_name || !requestData.last_name) {
      logger.warn('Missing required fields');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure temporary password
    const temporaryPassword = generatePassword(16);

    // Check if user already exists (both auth and profile)
    const { data: { users: existingAuthUsers }, error: listUsersError } = await supabase.auth.admin.listUsers();

    if (!listUsersError && existingAuthUsers) {
      const existingAuthUser = existingAuthUsers.find(u => u.email?.toLowerCase() === requestData.email.toLowerCase());

      if (existingAuthUser) {
        // Check if profile also exists
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id, role')
          .eq('id', existingAuthUser.id)
          .maybeSingle();

        if (existingProfile) {
          // User fully exists
          logger.warn('User already exists', { email: requestData.email, user_id: existingAuthUser.id });
          return new Response(
            JSON.stringify({ success: false, error: 'A user with this email already exists' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Orphaned auth user without profile - clean it up and create fresh
          logger.info('Cleaning up orphaned auth user', { user_id: existingAuthUser.id });
          await supabase.auth.admin.deleteUser(existingAuthUser.id);
        }
      }
    }

    // Create auth user
    // Note: The on_auth_user_created trigger will automatically create the user_profile
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: requestData.email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        tenant_id: null, // Required by trigger, but will be null for superadmins
        role: 'superadmin',
        first_name: requestData.first_name,
        middle_name: requestData.middle_name,
        last_name: requestData.last_name,
        phone_number: requestData.phone_number,
        position: requestData.position || 'Platform Administrator',
      },
    });

    if (authError || !authData.user) {
      logger.error('Failed to create auth user', { error: authError });
      return new Response(
        JSON.stringify({ success: false, error: authError?.message || 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Auth user created', { user_id: authData.user.id });

    // The on_auth_user_created trigger automatically creates the user_profile
    // Update the profile with additional fields (middle_name, position) that the trigger doesn't handle
    const { error: profileUpdateError } = await supabase
      .from('user_profiles')
      .update({
        middle_name: requestData.middle_name || null,
        position: requestData.position || 'Platform Administrator',
      })
      .eq('id', authData.user.id);

    if (profileUpdateError) {
      logger.error('Failed to update user profile with additional fields', {
        error: profileUpdateError,
        message: profileUpdateError.message,
      });
      // Don't fail the entire operation - the core profile was created by the trigger
      // Just log the warning
    }

    logger.info('Superadmin created successfully', { user_id: authData.user.id });

    // Send invitation email with credentials (non-blocking)
    try {
      const portalUrl = Deno.env.get('PLATFORM_URL') || 'http://localhost:3000';
      const emailTemplate = generateSuperadminInvitationEmail({
        superadminName: `${requestData.first_name} ${requestData.last_name}`,
        superadminEmail: requestData.email,
        portalUrl,
        temporaryPassword,
      });

      const emailResult = await sendEmail({
        to: requestData.email,
        subject: emailTemplate.subject,
        htmlBody: emailTemplate.htmlBody,
        textBody: emailTemplate.textBody,
      });

      if (!emailResult.success) {
        logger.warn('Failed to send invitation email', { error: emailResult.error });
        // Don't fail the entire operation if email fails, just log it
      } else {
        logger.info('Invitation email sent', { user_id: authData.user.id });
      }
    } catch (emailError) {
      logger.error('Error sending invitation email', { error: emailError });
      // Continue - user was created successfully even if email failed
    }

    // Return success response
    const response: CreateSuperadminResponse = {
      success: true,
      user_id: authData.user.id,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.error('Unexpected error', { error });
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
