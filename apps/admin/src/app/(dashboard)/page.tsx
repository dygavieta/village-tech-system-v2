import {
  Users,
  CheckSquare,
  FileText,
  Megaphone,
  Activity,
  TrendingUp,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDashboardData } from '@/lib/services/dashboard';

export default async function DashboardPage() {
  // Fetch all dashboard data (stats + recent activity)
  const { stats: rawStats, recentActivity } = await getDashboardData();

  // Calculate derived stats
  const stats = {
    totalHouseholds: rawStats.totalHouseholds,
    pendingApprovals: rawStats.pendingStickers + rawStats.pendingPermits,
    pendingStickers: rawStats.pendingStickers,
    pendingPermits: rawStats.pendingPermits,
    activePermits: rawStats.activePermits,
    announcements: rawStats.totalAnnouncements,
    gateActivity: rawStats.todayGateActivity,
    overdueFeesCount: rawStats.overdueFeesCount,
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your community.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Households */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Households</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHouseholds}</div>
            <p className="text-xs text-muted-foreground">Registered households</p>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingStickers} stickers, {stats.pendingPermits} permits
            </p>
          </CardContent>
        </Card>

        {/* Active Permits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Permits</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePermits}</div>
            <p className="text-xs text-muted-foreground">Construction in progress</p>
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.announcements}</div>
            <p className="text-xs text-muted-foreground">Total announcements</p>
          </CardContent>
        </Card>

        {/* Gate Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gate Activity (Today)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.gateActivity}</div>
            <p className="text-xs text-muted-foreground">Entry/exit logs today</p>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">All Systems</div>
            <p className="text-xs text-green-600">Operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions and events in your community</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity in the last 24 hours
                </p>
              )}
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {activity.type === 'sticker_request' && <CheckSquare className="h-4 w-4" />}
                      {activity.type === 'permit_request' && <FileText className="h-4 w-4" />}
                      {activity.type === 'household_registered' && <Users className="h-4 w-4" />}
                      {activity.type === 'announcement' && <Megaphone className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.household}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                  <Badge variant={activity.status === 'pending' ? 'default' : 'secondary'}>
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Reminders */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Reminders</CardTitle>
            <CardDescription>Important items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.pendingApprovals > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900">
                      {stats.pendingApprovals} pending approval
                      {stats.pendingApprovals !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-orange-700">
                      {stats.pendingStickers} sticker{stats.pendingStickers !== 1 ? 's' : ''} and{' '}
                      {stats.pendingPermits} permit{stats.pendingPermits !== 1 ? 's' : ''} awaiting review
                    </p>
                  </div>
                </div>
              )}

              {stats.overdueFeesCount > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Overdue association fees</p>
                    <p className="text-xs text-blue-700">
                      {stats.overdueFeesCount} household{stats.overdueFeesCount !== 1 ? 's have' : ' has'}{' '}
                      outstanding fees
                    </p>
                  </div>
                </div>
              )}

              {stats.activePermits > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                  <FileText className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Active construction projects</p>
                    <p className="text-xs text-green-700">
                      {stats.activePermits} ongoing construction permit{stats.activePermits !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}

              {stats.pendingApprovals === 0 &&
                stats.overdueFeesCount === 0 &&
                stats.activePermits === 0 && (
                  <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                    <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">All caught up!</p>
                      <p className="text-xs text-green-700">No pending items requiring attention</p>
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
