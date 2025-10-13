import {
  Megaphone,
  Plus,
  Bell,
  AlertCircle,
  Info,
  Calendar,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AnnouncementsPage() {
  // TODO: Replace with actual data from Supabase
  const stats = {
    totalAnnouncements: 12,
    activeAnnouncements: 5,
    criticalAlerts: 1,
    scheduledAnnouncements: 3,
  };

  const recentAnnouncements = [
    {
      id: 1,
      title: 'Community Pool Maintenance',
      urgency: 'important' as const,
      category: 'maintenance' as const,
      targetAudience: 'All Residents',
      createdAt: '2 hours ago',
      status: 'active',
    },
    {
      id: 2,
      title: 'Gate System Upgrade Tonight',
      urgency: 'critical' as const,
      category: 'security' as const,
      targetAudience: 'All Residents',
      createdAt: '5 hours ago',
      status: 'active',
    },
    {
      id: 3,
      title: 'Annual General Meeting Reminder',
      urgency: 'info' as const,
      category: 'event' as const,
      targetAudience: 'All Residents',
      createdAt: '1 day ago',
      status: 'scheduled',
    },
  ];

  const getUrgencyColor = (urgency: 'critical' | 'important' | 'info') => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'important':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getUrgencyIcon = (urgency: 'critical' | 'important' | 'info') => {
    switch (urgency) {
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      case 'important':
        return <Bell className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Manage and send announcements to residents and security personnel
          </p>
        </div>
        <Link href="/announcements/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Announcements</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnnouncements}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAnnouncements}</div>
            <p className="text-xs text-muted-foreground">Currently visible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">Requiring immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledAnnouncements}</div>
            <p className="text-xs text-muted-foreground">Upcoming announcements</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Announcements</CardTitle>
          <CardDescription>
            Latest announcements sent to your community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${getUrgencyColor(
                      announcement.urgency
                    )}`}
                  >
                    {getUrgencyIcon(announcement.urgency)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{announcement.title}</p>
                      <Badge variant="outline" className="text-xs">
                        {announcement.category}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {announcement.targetAudience}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {announcement.createdAt}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      announcement.status === 'active' ? 'default' : 'secondary'
                    }
                  >
                    {announcement.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader>
            <CardTitle className="text-base">View All Announcements</CardTitle>
            <CardDescription>Browse and manage all announcements</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader>
            <CardTitle className="text-base">Analytics</CardTitle>
            <CardDescription>View read rates and engagement metrics</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader>
            <CardTitle className="text-base">Templates</CardTitle>
            <CardDescription>Use pre-made announcement templates</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
