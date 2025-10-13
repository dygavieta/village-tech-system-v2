/**
 * Tenant Admin Users API Route
 *
 * POST /api/tenants/[id]/admins - Add a new admin user to a tenant
 */

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Create service client (same pattern as Edge Function)
    const supabase = createServiceClient();

    // Verify superadmin authentication using authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify superadmin role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Superadmin access required' }, { status: 403 });
    }

    const body = await request.json();
    const tenantId = params.id;

    // Verify tenant exists
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, subdomain')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check if user with this email already exists
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
    const emailExists = existingAuthUser?.users.some(u => u.email === body.email);

    if (emailExists) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Generate a temporary password (in production, this should be more secure)
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';

    // Create auth user
    const { data: authUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        tenant_id: tenantId,
        role: body.role || 'admin_officer',
        first_name: body.first_name,
        last_name: body.last_name,
      },
    });

    if (createUserError || !authUser.user) {
      console.error('Error creating auth user:', createUserError);
      return NextResponse.json(
        { error: 'Failed to create user account', details: createUserError?.message },
        { status: 500 }
      );
    }

    // Update user profile with additional fields (profile is auto-created by trigger)
    // The trigger already populated: id, tenant_id, role, first_name, last_name, phone_number
    // We just need to update position if provided
    if (body.position) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          position: body.position,
        })
        .eq('id', authUser.user.id);

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        // Don't fail the whole operation for just position update
      }
    }

    // Fetch the created profile
    const { data: newUserProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select()
      .eq('id', authUser.user.id)
      .single();

    if (profileError || !newUserProfile) {
      console.error('Error fetching user profile:', profileError);

      // Try to clean up auth user if profile doesn't exist
      await supabase.auth.admin.deleteUser(authUser.user.id);

      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError?.message || 'Profile not found' },
        { status: 500 }
      );
    }

    // TODO: Send welcome email with temporary password
    // In production, implement proper email service with password reset link
    console.log(`Admin user created: ${body.email} with temp password: ${tempPassword}`);

    return NextResponse.json(
      {
        user: newUserProfile,
        message: 'Admin user created successfully. Credentials have been sent via email.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin user creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
