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

export default function DashboardPage() {
  // TODO: Replace with actual data from Supabase
  const stats = {
    totalHouseholds: 247,
    householdsChange: '+12',
    pendingApprovals: 8,
    approvalsChange: '+3',
    activePermits: 5,
    permitsChange: '-2',
    announcements: 12,
    announcementsChange: '+2',
    gateActivity: '1,234',
    gateActivityChange: '+156',
  };

  const recentActivity = [
    {
      id: 1,
      type: 'sticker_request',
      title: 'New vehicle sticker request',
      household: 'Block 5 Lot 12',
      time: '5 minutes ago',
      status: 'pending',
    },
    {
      id: 2,
      type: 'permit_request',
      title: 'Construction permit application',
      household: 'Block 3 Lot 8',
      time: '1 hour ago',
      status: 'pending',
    },
    {
      id: 3,
      type: 'household_registered',
      title: 'New household registered',
      household: 'Block 7 Lot 15',
      time: '2 hours ago',
      status: 'completed',
    },
    {
      id: 4,
      type: 'announcement',
      title: 'Community maintenance scheduled',
      household: 'All residents',
      time: '3 hours ago',
      status: 'completed',
    },
  ];

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
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats.householdsChange}</span> from last month
            </p>
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
              <span className="text-orange-600">{stats.approvalsChange}</span> new requests
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
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">{stats.permitsChange}</span> from last week
            </p>
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
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats.announcementsChange}</span> this month
            </p>
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
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats.gateActivityChange}</span> entry/exit logs
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats */}
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
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {activity.type === 'sticker_request' && (
                        <CheckSquare className="h-4 w-4" />
                      )}
                      {activity.type === 'permit_request' && (
                        <FileText className="h-4 w-4" />
                      )}
                      {activity.type === 'household_registered' && (
                        <Users className="h-4 w-4" />
                      )}
                      {activity.type === 'announcement' && (
                        <Megaphone className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.household}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      activity.status === 'pending' ? 'default' : 'secondary'
                    }
                  >
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
              <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900">
                    8 pending approvals
                  </p>
                  <p className="text-xs text-orange-700">
                    Review sticker and permit requests awaiting approval
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Monthly fees due
                  </p>
                  <p className="text-xs text-blue-700">
                    15 households have outstanding association fees
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">
                    Community report ready
                  </p>
                  <p className="text-xs text-green-700">
                    October monthly report is ready for review
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
