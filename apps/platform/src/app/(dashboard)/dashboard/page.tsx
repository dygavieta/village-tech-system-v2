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

// These would normally fetch from Supabase
async function getDashboardStats() {
  // TODO: Replace with actual Supabase query
  // For now, return mock data
  return {
    totalTenants: 12,
    totalResidents: 3450,
    systemHealth: 99.8,
    monthlyRevenue: 45230,
    tenantGrowth: '+15%',
    residentGrowth: '+8%',
  };
}

async function getRecentActivity() {
  // TODO: Replace with actual Supabase query
  return [
    {
      id: '1',
      action: 'New tenant created',
      tenant: 'Greenfield Village',
      time: '2 hours ago',
      type: 'tenant',
    },
    {
      id: '2',
      action: 'Admin user activated',
      tenant: 'Sunset Heights',
      time: '5 hours ago',
      type: 'user',
    },
    {
      id: '3',
      action: 'Property import completed',
      tenant: 'Riverside Commons',
      time: '1 day ago',
      type: 'property',
    },
  ];
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
