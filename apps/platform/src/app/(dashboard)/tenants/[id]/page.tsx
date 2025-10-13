/**
 * Tenant Detail Page (T069)
 *
 * View tenant info, properties, gates, admin users, subscription limits
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/server';
import { GatesTabContent } from '@/components/tenants/GatesTabContent';
import { AdminsTabContent } from '@/components/tenants/AdminsTabContent';
import {
  Building2,
  Globe,
  Users,
  DoorOpen,
  Settings,
  ArrowLeft,
  MapPin,
  Calendar,
  Shield,
  Palette
} from 'lucide-react';

interface TenantDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getTenantDetails(tenantId: string) {
  const supabase = await createClient();

  // Fetch tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (tenantError || !tenant) {
    return null;
  }

  // Fetch properties count
  const { count: propertiesCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  // Fetch gates
  const { data: gates } = await supabase
    .from('gates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  // Fetch admin users
  const { data: adminUsers } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('role', ['admin_head', 'admin_officer'])
    .order('created_at', { ascending: false });

  return {
    tenant,
    propertiesCount: propertiesCount || 0,
    gates: gates || [],
    adminUsers: adminUsers || [],
  };
}

function TenantDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

const statusColors = {
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
  setup: 'bg-blue-100 text-blue-800 border-blue-200',
};

export default async function TenantDetailPage({ params }: TenantDetailPageProps) {
  const { id } = await params;
  const tenantData = await getTenantDetails(id);

  if (!tenantData) {
    notFound();
  }

  const { tenant, propertiesCount, gates, adminUsers } = tenantData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tenants">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{tenant.name}</h2>
          <p className="text-muted-foreground">Community tenant details and configuration</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/tenants/${tenant.id}/edit`}>
            <Settings className="mr-2 h-4 w-4" />
            Edit Settings
          </Link>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className={statusColors[tenant.status as keyof typeof statusColors]}>
              {tenant.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{propertiesCount}</div>
            <p className="text-xs text-muted-foreground">
              of {tenant.total_residences} max
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gates</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gates.length}</div>
            <p className="text-xs text-muted-foreground">Active entry points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers.length}</div>
            <p className="text-xs text-muted-foreground">Management users</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="gates">Gates ({gates.length})</TabsTrigger>
          <TabsTrigger value="admins">Admins ({adminUsers.length})</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        {/* Information Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Community Details</CardTitle>
              <CardDescription>Basic information about this tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                      <Building2 className="h-4 w-4" />
                      Community Name
                    </div>
                    <p className="text-lg font-semibold">{tenant.name}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                      <Globe className="h-4 w-4" />
                      Subdomain
                    </div>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {tenant.subdomain}.villagetech.com
                    </code>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                      <MapPin className="h-4 w-4" />
                      Community Type
                    </div>
                    <p className="capitalize">{tenant.community_type || 'Residential'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                      <Building2 className="h-4 w-4" />
                      Total Residences
                    </div>
                    <p>{tenant.total_residences}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      Created
                    </div>
                    <p>{new Date(tenant.created_at).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                      <Shield className="h-4 w-4" />
                      Status
                    </div>
                    <Badge variant="outline" className={statusColors[tenant.status as keyof typeof statusColors]}>
                      {tenant.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {tenant.legal_name && (
            <Card>
              <CardHeader>
                <CardTitle>Legal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Legal Name</p>
                <p className="font-medium">{tenant.legal_name}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Gates Tab */}
        <TabsContent value="gates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gate Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <GatesTabContent tenantId={tenant.id} gates={gates} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admins Tab */}
        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Administrative Users</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminsTabContent tenantId={tenant.id} adminUsers={adminUsers} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branding & Customization</CardTitle>
              <CardDescription>Visual identity for this community</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {tenant.branding_config?.logo_url ? (
                  <div>
                    <p className="text-sm font-medium mb-2">Community Logo</p>
                    <img
                      src={tenant.branding_config.logo_url}
                      alt={`${tenant.name} logo`}
                      className="h-24 w-auto rounded border"
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Palette className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">No logo uploaded</p>
                  </div>
                )}

                {tenant.branding_config?.primary_color && (
                  <div>
                    <p className="text-sm font-medium mb-2">Primary Color</p>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded border"
                        style={{ backgroundColor: tenant.branding_config.primary_color }}
                      />
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {tenant.branding_config.primary_color}
                      </code>
                    </div>
                  </div>
                )}

                <Button variant="outline" asChild>
                  <Link href={`/tenants/${tenant.id}/branding`}>
                    <Palette className="mr-2 h-4 w-4" />
                    Configure Branding
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
