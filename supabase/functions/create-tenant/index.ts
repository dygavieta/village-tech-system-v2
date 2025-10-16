/**
 * Create Tenant Edge Function
 *
 * Provisions a new residential community tenant with complete setup:
 * - Tenant record creation
 * - Property bulk import
 * - Gate configuration
 * - Admin head user creation
 * - Credentials delivery via email
 *
 * @route POST /functions/v1/create-tenant
 * @auth Required (superadmin only)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../_shared/logger.ts';
import { validateSubdomain } from '../_shared/subdomain-validator.ts';
import { generateAdminActivationEmail } from '../_shared/email-templates.ts';
import { sendEmail } from '../_shared/email.ts';

const logger = createLogger({ function: 'create-tenant' });

interface Property {
  address: string;
  phase?: string;
  block?: string;
  lot?: string;
  unit?: string;
  property_type: 'single_family' | 'townhouse' | 'condo' | 'lot_only';
  property_size_sqm?: number;
  lot_size_sqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking_slots?: number;
}

interface Gate {
  name: string;
  gate_type: 'primary' | 'secondary' | 'service' | 'emergency';
  operating_hours_start?: string; // HH:MM format
  operating_hours_end?: string; // HH:MM format
  gps_lat?: number;
  gps_lng?: number;
  rfid_reader_serial?: string;
}

interface CreateTenantRequest {
  // Tenant Info
  name: string;
  legal_name?: string;
  subdomain: string;
  community_type: 'HOA' | 'Condo' | 'Gated Village' | 'Subdivision';
  year_established?: number;
  timezone?: string;
  language?: string;

  // Subscription Limits
  max_residences: number;
  max_admin_users?: number;
  max_security_users?: number;
  storage_quota_gb?: number;

  // Properties
  properties?: Property[];

  // Gates
  gates?: Gate[];

  // Admin Head
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
  admin_phone?: string;
  admin_position?: string;
}

interface CreateTenantResponse {
  success: boolean;
  tenant_id?: string;
  subdomain?: string;
  admin_user_id?: string;
  properties_created?: number;
  gates_created?: number;
  error?: string;
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication (superadmin only)
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

    // Verify superadmin role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'superadmin') {
      logger.warn('Non-superadmin attempted tenant creation', { user_id: user.id, role: userProfile?.role });
      return new Response(JSON.stringify({ error: 'Forbidden: Superadmin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const requestData: CreateTenantRequest = await req.json();
    logger.info('Tenant creation requested', { subdomain: requestData.subdomain, admin_email: requestData.admin_email });

    // Validate subdomain
    const subdomainValidation = await validateSubdomain(requestData.subdomain, supabaseUrl, supabaseServiceKey);
    if (!subdomainValidation.valid) {
      logger.warn('Invalid subdomain', { subdomain: requestData.subdomain, error: subdomainValidation.error });
      console.error('Subdomain validation failed:', subdomainValidation.error);
      return new Response(JSON.stringify({ success: false, error: subdomainValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Create tenant record
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: requestData.name,
        legal_name: requestData.legal_name || requestData.name,
        subdomain: subdomainValidation.subdomain,
        community_type: requestData.community_type,
        total_residences: requestData.properties?.length || 0,
        year_established: requestData.year_established,
        timezone: requestData.timezone || 'UTC',
        language: requestData.language || 'en',
        max_residences: requestData.max_residences,
        max_admin_users: requestData.max_admin_users || 10,
        max_security_users: requestData.max_security_users || 20,
        storage_quota_gb: requestData.storage_quota_gb || 10,
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      logger.error('Failed to create tenant', tenantError);
      return new Response(JSON.stringify({ error: 'Failed to create tenant', details: tenantError?.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logger.info('Tenant created successfully', { tenant_id: tenant.id, subdomain: tenant.subdomain });

    // Step 2: Create properties (if provided)
    let propertiesCreated = 0;
    if (requestData.properties && requestData.properties.length > 0) {
      logger.info('Creating properties', { count: requestData.properties.length, properties: requestData.properties });

      const propertiesToInsert = requestData.properties.map((prop) => ({
        tenant_id: tenant.id,
        ...prop,
        status: 'vacant',
      }));

      logger.info('Properties to insert', { propertiesToInsert });

      const { data: createdProperties, error: propertiesError, count } = await supabase
        .from('properties')
        .insert(propertiesToInsert)
        .select('id', { count: 'exact' });

      if (propertiesError) {
        logger.error('Failed to create properties', { error: propertiesError.message, details: propertiesError });
        console.error('Properties creation error:', propertiesError);
      } else {
        propertiesCreated = count || 0;
        logger.info('Properties created successfully', { count: propertiesCreated, createdProperties });
      }
    }

    // Step 3: Create gates (if provided)
    let gatesCreated = 0;
    if (requestData.gates && requestData.gates.length > 0) {
      logger.info('Creating gates', { count: requestData.gates.length, gates: requestData.gates });

      const gatesToInsert = requestData.gates.map((gate) => ({
        tenant_id: tenant.id,
        name: gate.name,
        gate_type: gate.gate_type,
        status: 'active',
        operating_hours_start: gate.operating_hours_start || null,
        operating_hours_end: gate.operating_hours_end || null,
        gps_lat: gate.gps_lat || null,
        gps_lng: gate.gps_lng || null,
        rfid_reader_serial: gate.rfid_reader_serial || null,
      }));

      logger.info('Gates to insert', { gatesToInsert });

      const { data: createdGates, error: gatesError, count } = await supabase
        .from('gates')
        .insert(gatesToInsert)
        .select('id', { count: 'exact' });

      if (gatesError) {
        logger.error('Failed to create gates', { error: gatesError.message, details: gatesError });
        console.error('Gates creation error:', gatesError);
      } else {
        gatesCreated = count || 0;
        logger.info('Gates created successfully', { count: gatesCreated, createdGates });
      }
    }

    // Step 4: Create admin head user
    const temporaryPassword = generatePassword(16);

    const { data: adminAuthData, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: requestData.admin_email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        tenant_id: tenant.id,
        role: 'admin_head',
        first_name: requestData.admin_first_name,
        last_name: requestData.admin_last_name,
        phone_number: requestData.admin_phone,
        position: requestData.admin_position || 'Admin Head',
      },
    });

    if (adminAuthError || !adminAuthData.user) {
      logger.error('Failed to create admin user', adminAuthError);
      return new Response(
        JSON.stringify({ error: 'Tenant created but admin user creation failed', details: adminAuthError?.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    logger.info('Admin user created', { admin_user_id: adminAuthData.user.id });

    // Step 5: Send activation email
    const portalUrl = `https://${tenant.subdomain}.admin.villagetech.app`; // Adjust based on your domain
    const emailTemplate = generateAdminActivationEmail({
      adminName: `${requestData.admin_first_name} ${requestData.admin_last_name}`,
      adminEmail: requestData.admin_email,
      tenantName: tenant.name,
      subdomain: tenant.subdomain,
      portalUrl,
      temporaryPassword,
    });

    // Send activation email using Resend
    const emailResult = await sendEmail({
      to: requestData.admin_email,
      subject: emailTemplate.subject,
      htmlBody: emailTemplate.htmlBody,
      textBody: emailTemplate.textBody,
    });

    if (emailResult.success) {
      logger.info('Admin activation email sent successfully', {
        to: requestData.admin_email,
        messageId: emailResult.messageId,
      });
    } else {
      logger.warn('Failed to send admin activation email', {
        to: requestData.admin_email,
        error: emailResult.error,
      });
      // Don't fail the entire tenant creation if email fails
      // Admin can still be notified through other means
    }

    // Return success response
    const response: CreateTenantResponse = {
      success: true,
      tenant_id: tenant.id,
      subdomain: tenant.subdomain,
      admin_user_id: adminAuthData.user.id,
      properties_created: propertiesCreated,
      gates_created: gatesCreated,
    };

    logger.info('Tenant provisioning completed successfully', response);

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Unexpected error during tenant creation', error as Error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
