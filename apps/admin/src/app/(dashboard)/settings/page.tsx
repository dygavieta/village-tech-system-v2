import {
  Settings,
  FileText,
  ShieldCheck,
  Clock,
  Users,
  Bell,
  Palette,
  Key,
  ArrowRight,
  CheckCircle,
  Car,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  // TODO: Replace with actual data from Supabase
  const settingsStatus = {
    villageRulesUpdated: '2 weeks ago',
    totalRules: 12,
    gatesConfigured: 3,
    curfewEnabled: true,
    notificationsEnabled: true,
  };

  const settingsSections = [
    {
      id: 1,
      icon: FileText,
      title: 'Village Rules',
      description: 'Manage community policies, regulations, and guidelines',
      status: 'configured',
      lastUpdated: settingsStatus.villageRulesUpdated,
      link: '/settings/rules',
      stats: `${settingsStatus.totalRules} active rules`,
    },
    {
      id: 2,
      icon: ShieldCheck,
      title: 'Gates & Access Control',
      description: 'Configure gates, operating hours, and security settings',
      status: 'configured',
      lastUpdated: '1 week ago',
      link: '/settings/gates',
      stats: `${settingsStatus.gatesConfigured} gates active`,
    },
    {
      id: 3,
      icon: Car,
      title: 'Sticker Allocations',
      description: 'Configure default sticker allocation limits per household',
      status: 'configured',
      lastUpdated: '2 days ago',
      link: '/settings/allocations',
      stats: 'Default: 3 stickers',
    },
    {
      id: 4,
      icon: Clock,
      title: 'Curfew Settings',
      description: 'Set curfew hours, exceptions, and seasonal adjustments',
      status: settingsStatus.curfewEnabled ? 'enabled' : 'disabled',
      lastUpdated: '3 days ago',
      link: '/settings/curfew',
      stats: settingsStatus.curfewEnabled ? 'Enabled' : 'Disabled',
    },
    {
      id: 5,
      icon: Bell,
      title: 'Notifications',
      description: 'Configure notification preferences and delivery channels',
      status: settingsStatus.notificationsEnabled ? 'enabled' : 'disabled',
      lastUpdated: '5 days ago',
      link: '/settings/notifications',
      stats: 'Push, Email, SMS',
    },
    {
      id: 6,
      icon: Users,
      title: 'User Management',
      description: 'Manage admin officers, roles, and permissions',
      status: 'configured',
      lastUpdated: '1 month ago',
      link: '/settings/users',
      stats: '5 admin users',
    },
    {
      id: 7,
      icon: Palette,
      title: 'Appearance & Branding',
      description: 'Customize logo, colors, and community branding',
      status: 'configured',
      lastUpdated: '2 months ago',
      link: '/settings/branding',
      stats: 'Custom theme active',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'configured':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Configured
          </Badge>
        );
      case 'enabled':
        return (
          <Badge variant="default" className="bg-blue-600">
            Enabled
          </Badge>
        );
      case 'disabled':
        return (
          <Badge variant="secondary">
            Disabled
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage community settings, rules, gates, and preferences
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Village Rules</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settingsStatus.totalRules}</div>
            <p className="text-xs text-muted-foreground">Active rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Gates</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settingsStatus.gatesConfigured}</div>
            <p className="text-xs text-muted-foreground">Operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Curfew</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {settingsStatus.curfewEnabled ? 'On' : 'Off'}
            </div>
            <p className="text-xs text-muted-foreground">
              {settingsStatus.curfewEnabled ? 'Enforced' : 'Not enforced'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {settingsStatus.notificationsEnabled ? 'On' : 'Off'}
            </div>
            <p className="text-xs text-muted-foreground">3 channels active</p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Sections Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => (
          <Link key={section.id} href={section.link}>
            <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <section.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{section.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(section.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">
                      Last updated: {section.lastUpdated}
                    </p>
                    <p className="font-medium">{section.stats}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Configure
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Advanced configuration and system preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Security & Privacy</p>
                  <p className="text-sm text-muted-foreground">
                    Authentication, data retention, and privacy settings
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Settings className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Integration Settings</p>
                  <p className="text-sm text-muted-foreground">
                    Payment gateways, SMS providers, and third-party services
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Data Export & Backup</p>
                  <p className="text-sm text-muted-foreground">
                    Export community data and configure automated backups
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle>Help & Support</CardTitle>
          <CardDescription>
            Documentation, guides, and support resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="justify-start">
              Documentation
            </Button>
            <Button variant="outline" className="justify-start">
              Video Tutorials
            </Button>
            <Button variant="outline" className="justify-start">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
