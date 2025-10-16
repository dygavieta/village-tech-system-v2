/**
 * Properties API Route for Tenant Management
 *
 * GET    - Get all properties for a tenant
 * POST   - Add a new property to a tenant
 * PUT    - Update a property
 * DELETE - Delete a property
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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
  status?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const propertyType = searchParams.get('propertyType') || '';
    const status = searchParams.get('status') || '';

    // Build query
    let query = supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`address.ilike.%${search}%,phase.ilike.%${search}%,block.ilike.%${search}%,lot.ilike.%${search}%,unit.ilike.%${search}%`);
    }

    if (propertyType) {
      query = query.eq('property_type', propertyType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Order results
    query = query.order('created_at', { ascending: false });

    const { data: properties, error, count } = await query;

    if (error) {
      console.error('Error fetching properties:', error);
      return NextResponse.json(
        { error: 'Failed to fetch properties', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;
    const supabase = await createClient();
    const body: Property = await request.json();

    // Validate required fields
    if (!body.address || !body.property_type) {
      return NextResponse.json(
        { error: 'Address and property type are required' },
        { status: 400 }
      );
    }

    // Check if tenant exists
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, max_residences')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check current property count
    const { count: currentCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Only check limit if tenant has a non-zero limit set
    if (tenant.max_residences && tenant.max_residences > 0) {
      if (currentCount && currentCount >= tenant.max_residences) {
        return NextResponse.json(
          { error: `Maximum property limit (${tenant.max_residences}) reached` },
          { status: 400 }
        );
      }
    }

    // Create property
    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        ...body,
        tenant_id: tenantId,
        status: body.status || 'vacant',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      return NextResponse.json(
        { error: 'Failed to create property', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}