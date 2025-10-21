/**
 * Create Admin User Edge Function
 *
 * Creates a new admin user (admin_head or admin_officer) with authentication credentials.
 * This function uses the service role to create users with proper metadata.
 *
 * @route POST /functions/v1/create-admin-user
 * @auth Required (admin_head only)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../_shared/logger.ts';
import { sendEmail } from '../_shared/email.ts';
import { generateAdminActivationEmail } from '../_shared/email-templates.ts';

const logger = createLogger({ function: 'create-admin-user' });

/**
 * Generate a secure random password
 */
function generatePassword(length = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const all = lowercase + uppercase + numbers + special;

  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password.split('').sort(() => Math.random() - 0.5).join('');
}

interface CreateAdminUserRequest {
  email: string;
  tenant_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  phone_number?: string;
  role: 'admin_head' | 'admin_officer';
  position?: string;
}

interface CreateAdminUserResponse {
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

    // Verify admin_head role (only admin heads can create admin users)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin_head') {
      logger.warn('Non-admin-head attempted admin user creation', {
        user_id: user.id,
        role: userProfile?.role
      });
      return new Response(JSON.stringify({
        error: 'Forbidden: Admin Head access required'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const requestData: CreateAdminUserRequest = await req.json();
    logger.info('Admin user creation requested', {
      email: requestData.email,
      tenant_id: requestData.tenant_id,
      role: requestData.role
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
    if (!requestData.email || !requestData.tenant_id ||
        !requestData.first_name || !requestData.last_name || !requestData.role) {
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        details: 'email, tenant_id, first_name, last_name, and role are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate role
    if (!['admin_head', 'admin_officer'].includes(requestData.role)) {
      return new Response(JSON.stringify({
        error: 'Invalid role',
        details: 'Role must be either admin_head or admin_officer'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate secure temporary password
    const temporaryPassword = generatePassword(12);

    // Create admin user
    const { data: adminUserData, error: adminUserError } = await supabase.auth.admin.createUser({
      email: requestData.email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        tenant_id: requestData.tenant_id,
        role: requestData.role,
        first_name: requestData.first_name,
        middle_name: requestData.middle_name || null,
        last_name: requestData.last_name,
        phone_number: requestData.phone_number || null,
        position: requestData.position || null,
      },
    });

    if (adminUserError || !adminUserData.user) {
      logger.error('Failed to create admin user', adminUserError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create admin user',
          details: adminUserError?.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    logger.info('Admin user created successfully', {
      user_id: adminUserData.user.id,
      email: adminUserData.user.email,
      role: requestData.role
    });

    // Send welcome email with credentials
    try {
      // Fetch tenant info for email
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name, subdomain')
        .eq('id', requestData.tenant_id)
        .single();

      const tenantName = tenant?.name || 'Your Community';
      const subdomain = tenant?.subdomain || 'portal';
      const portalUrl = `https://${subdomain}.villagetech.com`; // Adjust as needed

      const emailTemplate = generateAdminActivationEmail({
        adminName: `${requestData.first_name} ${requestData.last_name}`,
        adminEmail: requestData.email,
        tenantName,
        subdomain,
        portalUrl,
        temporaryPassword,
      });

      const emailResult = await sendEmail({
        to: requestData.email,
        subject: emailTemplate.subject,
        htmlBody: emailTemplate.htmlBody,
        textBody: emailTemplate.textBody,
      });

      if (emailResult.success) {
        logger.info('Welcome email sent successfully', {
          to: requestData.email,
          messageId: emailResult.messageId,
        });
      } else {
        logger.warn('Failed to send welcome email', {
          to: requestData.email,
          error: emailResult.error,
        });
      }
    } catch (emailError) {
      // Don't fail user creation if email fails
      logger.error('Error sending welcome email', emailError as Error);
    }

    // Return success response
    const response: CreateAdminUserResponse = {
      success: true,
      user_id: adminUserData.user.id,
      email: adminUserData.user.email,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Unexpected error during admin user creation', error as Error);
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
