/**
 * Tenant List Page (T067)
 *
 * Display all tenants with search, filter by status, pagination
 */

import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TenantList } from '@/components/tenants/TenantList';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/server';

async function getTenants() {
  const supabase = await createClient();

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tenants:', error);
    return [];
  }

  return tenants || [];
}

function TenantsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

export default async function TenantsPage() {
  const tenants = await getTenants();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tenants</h2>
          <p className="text-muted-foreground">
            Manage all residential communities on the platform
          </p>
        </div>
        <Button asChild>
          <Link href="/tenants/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Tenant
          </Link>
        </Button>
      </div>

      {/* Tenant List */}
      <Suspense fallback={<TenantsLoadingSkeleton />}>
        <TenantList tenants={tenants} />
      </Suspense>
    </div>
  );
}
