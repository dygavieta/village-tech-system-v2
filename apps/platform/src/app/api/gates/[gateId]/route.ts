/**
 * Individual Gate API Route
 *
 * PUT /api/gates/[gateId] - Update a gate
 * DELETE /api/gates/[gateId] - Delete a gate
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { gateId: string } }
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

    const gateId = params.gateId;
    const body = await request.json();

    // Verify gate exists
    const { data: existingGate, error: gateError } = await supabase
      .from('gates')
      .select('id')
      .eq('id', gateId)
      .single();

    if (gateError || !existingGate) {
      return NextResponse.json({ error: 'Gate not found' }, { status: 404 });
    }

    // Prepare gate data
    const gateData = {
      name: body.name,
      gate_type: body.gate_type,
      operating_hours_start: body.operating_hours_start || null,
      operating_hours_end: body.operating_hours_end || null,
      rfid_reader_serial: body.rfid_reader_serial || null,
    };

    // Update gate
    const { data: gate, error: updateError } = await supabase
      .from('gates')
      .update(gateData)
      .eq('id', gateId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating gate:', updateError);
      return NextResponse.json(
        { error: 'Failed to update gate', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ gate }, { status: 200 });
  } catch (error) {
    console.error('Gate update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { gateId: string } }
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

    const gateId = params.gateId;

    // Verify gate exists
    const { data: existingGate, error: gateError } = await supabase
      .from('gates')
      .select('id')
      .eq('id', gateId)
      .single();

    if (gateError || !existingGate) {
      return NextResponse.json({ error: 'Gate not found' }, { status: 404 });
    }

    // Delete gate
    const { error: deleteError } = await supabase
      .from('gates')
      .delete()
      .eq('id', gateId);

    if (deleteError) {
      console.error('Error deleting gate:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete gate', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Gate deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Gate deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}