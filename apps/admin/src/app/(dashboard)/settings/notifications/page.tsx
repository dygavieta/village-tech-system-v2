import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  ArrowLeft,
  CheckCircle,
  Settings,
  Volume2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function NotificationSettingsPage() {
  // TODO: Replace with actual data from Supabase
  const notificationChannels = [
    {
      id: 1,
      name: 'Push Notifications',
      icon: Smartphone,
      description: 'Mobile app push notifications for residents and staff',
      enabled: true,
      settings: {
        announcements: true,
        emergencies: true,
        gateActivity: false,
        feeReminders: true,
        approvals: true,
      },
    },
    {
      id: 2,
      name: 'Email Notifications',
      icon: Mail,
      description: 'Email notifications for important updates and reports',
      enabled: true,
      settings: {
        announcements: true,
        emergencies: true,
        gateActivity: false,
        feeReminders: true,
        approvals: true,
        weeklyReports: true,
      },
    },
    {
      id: 3,
      name: 'SMS Notifications',
      icon: MessageSquare,
      description: 'Text message notifications for critical alerts',
      enabled: true,
      settings: {
        announcements: false,
        emergencies: true,
        gateActivity: false,
        feeReminders: true,
        approvals: false,
      },
    },
  ];

  const notificationTypes = [
    {
      name: 'Announcements',
      description: 'Community announcements and updates',
      priority: 'Normal',
    },
    {
      name: 'Emergencies',
      description: 'Critical alerts and emergency notifications',
      priority: 'Critical',
    },
    {
      name: 'Gate Activity',
      description: 'Entry/exit logs and visitor notifications',
      priority: 'Low',
    },
    {
      name: 'Fee Reminders',
      description: 'Payment reminders and overdue notices',
      priority: 'High',
    },
    {
      name: 'Approvals',
      description: 'Permit and sticker approval notifications',
      priority: 'Normal',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
            <p className="text-muted-foreground">
              Configure notification preferences and delivery channels
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Channels</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Push, Email, SMS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications Today</CardTitle>
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <p className="text-xs text-muted-foreground">Sent to residents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-green-600">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Configure delivery methods for different types of notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationChannels.map((channel) => (
            <div key={channel.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <channel.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{channel.name}</p>
                      <Badge variant={channel.enabled ? 'default' : 'secondary'}>
                        {channel.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{channel.description}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t">
                {Object.entries(channel.settings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
                      {value ? 'On' : 'Off'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Different categories of notifications and their priority levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notificationTypes.map((type, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{type.name}</p>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
                <Badge
                  variant={
                    type.priority === 'Critical'
                      ? 'destructive'
                      : type.priority === 'High'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {type.priority}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Best Practices</CardTitle>
          <CardDescription>
            Guidelines for effective community communication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Priority-Based Channels</p>
                <p className="text-muted-foreground">Use SMS only for critical alerts, email for regular updates, and push for time-sensitive info</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Avoid Notification Fatigue</p>
                <p className="text-muted-foreground">Don't overwhelm residents with too many notifications</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Clear and Concise</p>
                <p className="text-muted-foreground">Keep notification messages short and actionable</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Respect Quiet Hours</p>
                <p className="text-muted-foreground">Avoid sending non-critical notifications during curfew hours</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
