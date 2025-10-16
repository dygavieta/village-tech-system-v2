/**
 * Individual Property API Route
 *
 * GET    - Get a specific property
 * PUT    - Update a property
 * DELETE - Delete a property
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface PropertyUpdate {
  address?: string;
  phase?: string;
  block?: string;
  lot?: string;
  unit?: string;
  property_type?: 'single_family' | 'townhouse' | 'condo' | 'lot_only';
  property_size_sqm?: number;
  lot_size_sqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking_slots?: number;
  status?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; propertyId: string }> }
) {
  try {
    const { id: tenantId, propertyId } = await params;
    const supabase = await createClient();

    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching property:', error);
      return NextResponse.json(
        { error: 'Property not found', details: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; propertyId: string }> }
) {
  try {
    const { id: tenantId, propertyId } = await params;
    const supabase = await createClient();
    const body: PropertyUpdate = await request.json();

    // Verify property belongs to tenant
    const { data: existingProperty, error: checkError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('tenant_id', tenantId)
      .single();

    if (checkError || !existingProperty) {
      return NextResponse.json(
        { error: 'Property not found or access denied' },
        { status: 404 }
      );
    }

    // Update property
    const { data: property, error } = await supabase
      .from('properties')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', propertyId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating property:', error);
      return NextResponse.json(
        { error: 'Failed to update property', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; propertyId: string }> }
) {
  try {
    const { id: tenantId, propertyId } = await params;
    const supabase = await createClient();

    // Check if property exists and belongs to tenant
    const { data: existingProperty, error: checkError } = await supabase
      .from('properties')
      .select('id, address')
      .eq('id', propertyId)
      .eq('tenant_id', tenantId)
      .single();

    if (checkError || !existingProperty) {
      return NextResponse.json(
        { error: 'Property not found or access denied' },
        { status: 404 }
      );
    }

    // Check if property has associated data (households, etc.)
    const { data: households, error: householdError } = await supabase
      .from('households')
      .select('id')
      .eq('property_id', propertyId)
      .limit(1);

    if (householdError) {
      console.error('Error checking households:', householdError);
    }

    if (households && households.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete property with associated households',
          details: 'Please remove all households from this property first'
        },
        { status: 400 }
      );
    }

    // Delete property
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error deleting property:', error);
      return NextResponse.json(
        { error: 'Failed to delete property', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Property deleted successfully',
        deletedProperty: existingProperty
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}