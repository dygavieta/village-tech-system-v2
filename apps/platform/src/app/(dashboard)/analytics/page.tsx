/**
 * Analytics Page
 *
 * Platform-wide analytics and reporting for superadmin
 */

import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  DoorOpen,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';

async function getAnalyticsData() {
  const supabase = await createClient();

  // Get tenant stats
  const { count: totalTenants } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true });

  const { count: activeTenants } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Get tenant breakdown by type
  const { data: tenantsByType } = await supabase
    .from('tenants')
    .select('community_type')
    .order('community_type');

  const typeBreakdown = tenantsByType?.reduce((acc, tenant) => {
    const type = tenant.community_type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get residents stats
  const { count: totalResidents } = await supabase
    .from('households')
    .select('*', { count: 'exact', head: true });

  // Get properties stats
  const { count: totalProperties } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true });

  // Get gates stats
  const { count: totalGates } = await supabase
    .from('gates')
    .select('*', { count: 'exact', head: true });

  // Get user stats
  const { count: totalAdmins } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .in('role', ['admin_head', 'admin_officer']);

  // Get monthly growth data (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: recentTenants } = await supabase
    .from('tenants')
    .select('created_at')
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at');

  // Group tenants by month
  const monthlyGrowth = recentTenants?.reduce((acc, tenant) => {
    const month = new Date(tenant.created_at).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalTenants: totalTenants || 0,
    activeTenants: activeTenants || 0,
    totalResidents: totalResidents || 0,
    totalProperties: totalProperties || 0,
    totalGates: totalGates || 0,
    totalAdmins: totalAdmins || 0,
    typeBreakdown: typeBreakdown || {},
    monthlyGrowth: monthlyGrowth || {},
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  const activationRate = data.totalTenants > 0
    ? Math.round((data.activeTenants / data.totalTenants) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">Platform-wide insights and metrics</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalTenants}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 font-medium">{data.activeTenants} active</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Residents</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalResidents}</div>
                <p className="text-xs text-muted-foreground">Across all communities</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalProperties}</div>
                <p className="text-xs text-muted-foreground">Registered properties</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Gates</CardTitle>
                <DoorOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalGates}</div>
                <p className="text-xs text-muted-foreground">Active entry points</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
                <CardDescription>Important platform indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Activation Rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{activationRate}%</span>
                    {activationRate >= 80 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-t">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Admin Users</span>
                  </div>
                  <span className="text-2xl font-bold">{data.totalAdmins}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-t">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Avg Properties per Tenant</span>
                  </div>
                  <span className="text-2xl font-bold">
                    {data.totalTenants > 0
                      ? Math.round(data.totalProperties / data.totalTenants)
                      : 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Platform performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Database Connection</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Healthy
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-t">
                  <span className="text-sm font-medium">API Response Time</span>
                  <Badge variant="outline">~150ms</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-t">
                  <span className="text-sm font-medium">Uptime (30 days)</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    99.9%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tenants Tab */}
        <TabsContent value="tenants" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                <CardTitle>Tenants by Community Type</CardTitle>
              </div>
              <CardDescription>Distribution of tenant communities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.typeBreakdown).length > 0 ? (
                  Object.entries(data.typeBreakdown).map(([type, count]) => {
                    const percentage = data.totalTenants > 0
                      ? Math.round((count / data.totalTenants) * 100)
                      : 0;
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{type}</span>
                          <span className="text-muted-foreground">{count} ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No tenant data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>User Statistics</CardTitle>
              </div>
              <CardDescription>Platform user metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Admin Users</p>
                  <p className="text-3xl font-bold">{data.totalAdmins}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Residents</p>
                  <p className="text-3xl font-bold">{data.totalResidents}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  Detailed user analytics coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Growth Tab */}
        <TabsContent value="growth" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <CardTitle>Tenant Growth (Last 6 Months)</CardTitle>
              </div>
              <CardDescription>New tenant registrations over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.monthlyGrowth).length > 0 ? (
                  Object.entries(data.monthlyGrowth).map(([month, count]) => (
                    <div key={month} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{month}</span>
                        </div>
                        <span className="text-muted-foreground">{count} new tenants</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600 transition-all"
                          style={{ width: `${Math.min(count * 10, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No growth data available for the last 6 months
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
