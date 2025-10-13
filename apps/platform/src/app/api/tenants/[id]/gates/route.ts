/**
 * Tenant Gates API Route
 *
 * POST /api/tenants/[id]/gates - Add a new gate to a tenant
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
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

    // Verify tenant exists
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Prepare gate data
    const gateData = {
      tenant_id: tenantId,
      name: body.name,
      gate_type: body.gate_type || 'primary',
      status: 'active',
      operating_hours_start: body.operating_hours_start || null,
      operating_hours_end: body.operating_hours_end || null,
      gps_lat: body.gps_lat || null,
      gps_lng: body.gps_lng || null,
      rfid_reader_serial: body.rfid_reader_serial || null,
    };

    // Insert gate
    const { data: gate, error: gateError } = await supabase
      .from('gates')
      .insert(gateData)
      .select()
      .single();

    if (gateError) {
      console.error('Error creating gate:', gateError);
      return NextResponse.json(
        { error: 'Failed to create gate', details: gateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ gate }, { status: 201 });
  } catch (error) {
    console.error('Gate creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
