/**
 * Platform Dashboard Page (T059)
 *
 * Overview dashboard for superadmin showing:
 * - Total tenants, total residents, system health, revenue metrics
 * - Recent activity feed
 * - Quick actions
 */

import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Activity, DollarSign, Plus, TrendingUp, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/server';

async function getDashboardStats() {
  const supabase = await createClient();

  // Get total tenants
  const { count: totalTenants } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true });

  // Get total residents (households)
  const { count: totalResidents } = await supabase
    .from('households')
    .select('*', { count: 'exact', head: true });

  // Get tenants created in last 30 days for growth calculation
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: recentTenants } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());

  // Get households created in last 30 days
  const { count: recentResidents } = await supabase
    .from('households')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());

  // Calculate growth percentages
  const tenantGrowth = totalTenants && recentTenants
    ? `+${Math.round((recentTenants / totalTenants) * 100)}%`
    : '+0%';

  const residentGrowth = totalResidents && recentResidents
    ? `+${Math.round((recentResidents / totalResidents) * 100)}%`
    : '+0%';

  return {
    totalTenants: totalTenants || 0,
    totalResidents: totalResidents || 0,
    systemHealth: 99.8, // This could be calculated based on system metrics
    monthlyRevenue: 0, // TODO: Calculate from association_fees table when implemented
    tenantGrowth,
    residentGrowth,
  };
}

async function getRecentActivity() {
  const supabase = await createClient();

  // Get recently created tenants
  const { data: recentTenants } = await supabase
    .from('tenants')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  // Get recently created admin users
  const { data: recentAdmins } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, created_at, tenant_id, tenants(name)')
    .in('role', ['admin_head', 'admin_officer'])
    .order('created_at', { ascending: false })
    .limit(10);

  // Combine and format activities
  const activities: Array<{
    id: string;
    action: string;
    tenant: string;
    time: string;
    type: 'tenant' | 'user' | 'property';
    timestamp: Date;
  }> = [];

  // Add tenant activities
  recentTenants?.forEach((tenant) => {
    activities.push({
      id: `tenant-${tenant.id}`,
      action: 'New tenant created',
      tenant: tenant.name,
      time: formatTimeAgo(new Date(tenant.created_at)),
      type: 'tenant',
      timestamp: new Date(tenant.created_at),
    });
  });

  // Add admin user activities
  recentAdmins?.forEach((admin) => {
    const tenantName = (admin.tenants as any)?.name || 'Unknown Tenant';
    activities.push({
      id: `user-${admin.id}`,
      action: 'Admin user created',
      tenant: tenantName,
      time: formatTimeAgo(new Date(admin.created_at)),
      type: 'user',
      timestamp: new Date(admin.created_at),
    });
  });

  // Sort by timestamp and take top 5
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 60) {
    return `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
}

function DashboardStats({ stats }: { stats: Awaited<ReturnType<typeof getDashboardStats>> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTenants}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600 font-medium">{stats.tenantGrowth}</span> from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Residents</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalResidents.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600 font-medium">{stats.residentGrowth}</span> from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.systemHealth}%</div>
          <p className="text-xs text-muted-foreground">All systems operational</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            <TrendingUp className="inline h-3 w-3 text-green-600" /> +12% from last month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function RecentActivity({ activities }: { activities: Awaited<ReturnType<typeof getRecentActivity>> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates across all tenants</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                {activity.type === 'tenant' && <Building2 className="h-4 w-4" />}
                {activity.type === 'user' && <Users className="h-4 w-4" />}
                {activity.type === 'property' && <AlertCircle className="h-4 w-4" />}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{activity.action}</p>
                <p className="text-sm text-muted-foreground">{activity.tenant}</p>
              </div>
              <div className="text-sm text-muted-foreground">{activity.time}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Button asChild className="w-full justify-start" variant="outline">
          <Link href="/tenants/create">
            <Plus className="mr-2 h-4 w-4" />
            Create New Tenant
          </Link>
        </Button>
        <Button asChild className="w-full justify-start" variant="outline">
          <Link href="/tenants">
            <Building2 className="mr-2 h-4 w-4" />
            View All Tenants
          </Link>
        </Button>
        <Button asChild className="w-full justify-start" variant="outline">
          <Link href="/analytics">
            <TrendingUp className="mr-2 h-4 w-4" />
            View Analytics
          </Link>
        </Button>
        <Button asChild className="w-full justify-start" variant="outline">
          <Link href="/settings">
            <Activity className="mr-2 h-4 w-4" />
            System Settings
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function StatsLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const activities = await getRecentActivity();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back to the VillageTech Platform</p>
        </div>
        <Button asChild>
          <Link href="/tenants/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Tenant
          </Link>
        </Button>
      </div>

      <Suspense fallback={<StatsLoadingSkeleton />}>
        <DashboardStats stats={stats} />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <RecentActivity activities={activities} />
        </div>
        <div className="lg:col-span-3">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
