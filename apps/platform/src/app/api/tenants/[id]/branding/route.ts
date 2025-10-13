/**
 * Tenant Branding API Route
 *
 * PATCH /api/tenants/[id]/branding - Update tenant branding configuration
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify superadmin authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse JWT payload to check role
    const base64Payload = session.access_token.split('.')[1];
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
    const userRole = payload.user_role;

    if (userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Superadmin access required' }, { status: 403 });
    }

    const body = await request.json();
    const tenantId = params.id;

    // Update tenant branding
    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({
        logo_url: body.logo_url || null,
        primary_color: body.primary_color || '#000000',
        branding_config: body.branding_config || {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tenant branding:', error);
      return NextResponse.json(
        { error: 'Failed to update branding', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ tenant }, { status: 200 });
  } catch (error) {
    console.error('Tenant branding update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
