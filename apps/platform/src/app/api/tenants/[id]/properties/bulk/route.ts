/**
 * Bulk Properties Import API Route
 *
 * POST - Import multiple properties from CSV
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface BulkPropertyImport {
  properties: Array<{
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
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;
    const supabase = await createClient();
    const body: BulkPropertyImport = await request.json();

    // Validate request body
    if (!body.properties || !Array.isArray(body.properties)) {
      return NextResponse.json(
        { error: 'Properties array is required' },
        { status: 400 }
      );
    }

    if (body.properties.length === 0) {
      return NextResponse.json(
        { error: 'At least one property must be provided' },
        { status: 400 }
      );
    }

    // Check if tenant exists and get max residences limit
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

    const newPropertyCount = body.properties.length;
    const totalCount = (currentCount || 0) + newPropertyCount;

    // Only check limit if tenant has a non-zero limit set
    if (tenant.max_residences && tenant.max_residences > 0) {
      if (totalCount > tenant.max_residences) {
        return NextResponse.json(
          {
            error: `Import would exceed property limit. Current: ${currentCount}, Requested: ${newPropertyCount}, Limit: ${tenant.max_residences}`
          },
          { status: 400 }
        );
      }
    }

    // Prepare properties for insertion
    const propertiesToInsert = body.properties.map(property => {
      const { row, ...propertyData } = property; // Remove the 'row' field
      return {
        ...propertyData,
        tenant_id: tenantId,
        status: propertyData.status || 'vacant',
      };
    });

    // Insert properties in batches (Supabase limit is 1000 rows per insert)
    const batchSize = 1000;
    const results = [];
    let totalInserted = 0;

    for (let i = 0; i < propertiesToInsert.length; i += batchSize) {
      const batch = propertiesToInsert.slice(i, i + batchSize);

      const { data: insertedProperties, error } = await supabase
        .from('properties')
        .insert(batch)
        .select();

      if (error) {
        // If batch fails, return partial success if any batches were successful
        if (totalInserted > 0) {
          return NextResponse.json(
            {
              message: `Partially imported ${totalInserted} properties before error`,
              insertedCount: totalInserted,
              error: error.message
            },
            { status: 207 } // 207 Multi-Status
          );
        }

        console.error('Error inserting property batch:', error);
        return NextResponse.json(
          { error: 'Failed to insert properties', details: error.message },
          { status: 500 }
        );
      }

      results.push(...(insertedProperties || []));
      totalInserted += insertedProperties?.length || 0;
    }

    return NextResponse.json({
      message: `Successfully imported ${totalInserted} properties`,
      insertedCount: totalInserted,
      properties: results,
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in bulk import:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}