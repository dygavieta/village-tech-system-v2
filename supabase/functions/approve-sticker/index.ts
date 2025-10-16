/**
 * Approve Sticker Edge Function
 *
 * Processes vehicle sticker approval or rejection by admin users:
 * - Validates admin authorization
 * - Updates sticker status (approved/rejected)
 * - Sends notification to household
 * - Returns updated sticker details
 *
 * @route POST /functions/v1/approve-sticker
 * @auth Required (admin_head or admin_officer only)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../_shared/logger.ts';
import { sendEmail, generateStickerApprovalEmail, generateStickerRejectionEmail } from '../_shared/email.ts';

const logger = createLogger({ function: 'approve-sticker' });

interface ApproveStickerRequest {
  sticker_id: string;
  decision: 'approved' | 'rejected';
  rejection_reason?: string;
  rfid_serial?: string; // Required if approved
}

interface ApproveStickerResponse {
  success: boolean;
  sticker?: {
    id: string;
    status: string;
    rfid_serial?: string;
    household_id: string;
    vehicle_plate: string;
  };
  error?: string;
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

    // Verify admin role and get tenant_id
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['admin_head', 'admin_officer'].includes(userProfile.role)) {
      logger.warn('Non-admin attempted sticker approval', { user_id: user.id, role: userProfile?.role });
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tenantId = userProfile.tenant_id;

    // Parse request body
    const requestData: ApproveStickerRequest = await req.json();
    logger.info('Sticker approval requested', {
      sticker_id: requestData.sticker_id,
      decision: requestData.decision,
      admin_id: user.id,
    });

    // Validate request
    if (!requestData.sticker_id || !requestData.decision) {
      return new Response(JSON.stringify({ error: 'Missing required fields: sticker_id, decision' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (requestData.decision === 'approved' && !requestData.rfid_serial) {
      return new Response(JSON.stringify({ error: 'RFID serial required for approval' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch sticker with household and user information to verify tenant isolation and for email
    const { data: sticker, error: stickerFetchError } = await supabase
      .from('vehicle_stickers')
      .select(`
        id,
        tenant_id,
        household_id,
        vehicle_plate,
        vehicle_make,
        vehicle_model,
        vehicle_color,
        sticker_type,
        status,
        households!vehicle_stickers_household_id_fkey(
          household_head_id,
          user_profiles!households_household_head_id_fkey(
            id,
            email,
            first_name,
            last_name
          )
        )
      `)
      .eq('id', requestData.sticker_id)
      .single();

    if (stickerFetchError || !sticker) {
      logger.warn('Sticker not found', { sticker_id: requestData.sticker_id, error: stickerFetchError?.message });
      return new Response(JSON.stringify({ error: 'Sticker not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify tenant isolation
    if (sticker.tenant_id !== tenantId) {
      logger.warn('Cross-tenant access attempt', {
        sticker_tenant_id: sticker.tenant_id,
        admin_tenant_id: tenantId,
      });
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if sticker is already processed
    if (sticker.status !== 'pending') {
      logger.warn('Sticker already processed', { sticker_id: requestData.sticker_id, current_status: sticker.status });
      return new Response(
        JSON.stringify({ error: `Sticker already ${sticker.status}`, current_status: sticker.status }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update sticker status
    const updateData: any = {
      status: requestData.decision === 'approved' ? 'approved' : 'deactivated',
      updated_at: new Date().toISOString(),
    };

    if (requestData.decision === 'approved') {
      updateData.rfid_serial = requestData.rfid_serial;
      updateData.issue_date = new Date().toISOString().split('T')[0];
      // Set expiry date to 1 year from now
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      updateData.expiry_date = expiryDate.toISOString().split('T')[0];
    }

    const { data: updatedSticker, error: updateError } = await supabase
      .from('vehicle_stickers')
      .update(updateData)
      .eq('id', requestData.sticker_id)
      .select('id, status, rfid_serial, household_id, vehicle_plate')
      .single();

    if (updateError || !updatedSticker) {
      logger.error('Failed to update sticker', { error: updateError?.message });
      return new Response(JSON.stringify({ error: 'Failed to update sticker', details: updateError?.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logger.info('Sticker status updated', {
      sticker_id: updatedSticker.id,
      new_status: updatedSticker.status,
      decision: requestData.decision,
    });

    // Send notification email to household head
    const householdHead = sticker.households?.user_profiles;
    if (householdHead?.email) {
      // Fetch tenant name for email
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name, subdomain')
        .eq('id', tenantId)
        .single();

      const tenantName = tenant?.name || 'Your Community';
      const portalUrl = tenant?.subdomain
        ? `https://${tenant.subdomain}.villagetech.com/stickers`
        : undefined;

      if (requestData.decision === 'approved') {
        const emailTemplate = generateStickerApprovalEmail({
          recipientName: `${householdHead.first_name} ${householdHead.last_name}`,
          vehiclePlate: sticker.vehicle_plate,
          vehicleMake: sticker.vehicle_make || 'N/A',
          vehicleModel: sticker.vehicle_model || 'N/A',
          vehicleColor: sticker.vehicle_color || 'N/A',
          stickerType: sticker.sticker_type || 'standard',
          rfidSerial: requestData.rfid_serial!,
          expiryDate: updateData.expiry_date,
          tenantName,
          portalUrl,
        });

        const emailResult = await sendEmail({
          to: householdHead.email,
          subject: emailTemplate.subject,
          htmlBody: emailTemplate.htmlBody,
          textBody: emailTemplate.textBody,
        });

        if (emailResult.success) {
          logger.info('Sticker approval email sent successfully', {
            to: householdHead.email,
            messageId: emailResult.messageId,
          });
        } else {
          logger.warn('Failed to send sticker approval email', {
            to: householdHead.email,
            error: emailResult.error,
          });
        }
      } else {
        // Rejection
        const emailTemplate = generateStickerRejectionEmail({
          recipientName: `${householdHead.first_name} ${householdHead.last_name}`,
          vehiclePlate: sticker.vehicle_plate,
          rejectionReason: requestData.rejection_reason || 'Please contact admin office for details',
          tenantName,
          portalUrl,
        });

        const emailResult = await sendEmail({
          to: householdHead.email,
          subject: emailTemplate.subject,
          htmlBody: emailTemplate.htmlBody,
          textBody: emailTemplate.textBody,
        });

        if (emailResult.success) {
          logger.info('Sticker rejection email sent successfully', {
            to: householdHead.email,
            messageId: emailResult.messageId,
          });
        } else {
          logger.warn('Failed to send sticker rejection email', {
            to: householdHead.email,
            error: emailResult.error,
          });
        }
      }
    } else {
      logger.warn('No email address found for household head', {
        household_id: updatedSticker.household_id,
      });
    }

    // Return success response
    const response: ApproveStickerResponse = {
      success: true,
      sticker: updatedSticker,
    };

    logger.info('Sticker approval processed successfully', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Unexpected error during sticker approval', error as Error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
