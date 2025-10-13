/**
 * Tenant API Route
 *
 * PATCH /api/tenants/[id] - Update tenant information
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

    // Validate required fields
    if (!body.name || !body.community_type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, community_type' },
        { status: 400 }
      );
    }

    // Validate subscription limits
    if (body.max_residences && body.max_residences < 1) {
      return NextResponse.json(
        { error: 'max_residences must be at least 1' },
        { status: 400 }
      );
    }

    // Update tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({
        name: body.name,
        legal_name: body.legal_name || null,
        community_type: body.community_type,
        year_established: body.year_established || null,
        timezone: body.timezone || 'UTC',
        language: body.language || 'en',
        max_residences: body.max_residences,
        max_admin_users: body.max_admin_users,
        max_security_users: body.max_security_users,
        storage_quota_gb: body.storage_quota_gb,
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tenant:', error);
      return NextResponse.json(
        { error: 'Failed to update tenant', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ tenant }, { status: 200 });
  } catch (error) {
    console.error('Tenant update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
