/**
 * Tenant Edit Page
 *
 * Edit tenant settings and configuration
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft } from 'lucide-react';
import { TenantEditForm } from '@/components/tenants/TenantEditForm';

interface TenantEditPageProps {
  params: {
    id: string;
  };
}

async function getTenant(tenantId: string) {
  const supabase = await createClient();

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (error || !tenant) {
    return null;
  }

  return tenant;
}

export default async function TenantEditPage({ params }: TenantEditPageProps) {
  const tenant = await getTenant(params.id);

  if (!tenant) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/tenants/${tenant.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">Edit Tenant Settings</h2>
          <p className="text-muted-foreground">{tenant.name}</p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Configuration</CardTitle>
          <CardDescription>Update tenant details and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <TenantEditForm tenant={tenant} />
        </CardContent>
      </Card>
    </div>
  );
}
