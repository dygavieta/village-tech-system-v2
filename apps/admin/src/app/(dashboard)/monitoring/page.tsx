import {
  Activity,
  AlertTriangle,
  Shield,
  Camera,
  TrendingUp,
  ArrowRight,
  Clock,
  MapPin,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MonitoringPage() {
  // TODO: Replace with actual data from Supabase
  const stats = {
    gateActivityToday: 1234,
    gateActivityChange: '+156',
    activeIncidents: 2,
    resolvedIncidents: 18,
    totalGates: 3,
  };

  const recentActivity = [
    {
      id: 1,
      type: 'entry' as const,
      gate: 'Main Gate',
      description: 'Resident entry - Vehicle ABC1234',
      time: '2 minutes ago',
      guardName: 'Officer Juan',
    },
    {
      id: 2,
      type: 'incident' as const,
      gate: 'South Gate',
      description: 'Suspicious person reported',
      time: '15 minutes ago',
      severity: 'medium' as const,
      status: 'responding',
    },
    {
      id: 3,
      type: 'exit' as const,
      gate: 'Main Gate',
      description: 'Guest departure - Vehicle XYZ5678',
      time: '30 minutes ago',
      guardName: 'Officer Maria',
    },
    {
      id: 4,
      type: 'entry' as const,
      gate: 'North Gate',
      description: 'Delivery - Package for Block 5 Lot 12',
      time: '1 hour ago',
      guardName: 'Officer Pedro',
    },
  ];

  const activeIncidents = [
    {
      id: 1,
      title: 'Suspicious Person at South Gate',
      severity: 'high' as const,
      location: 'South Gate',
      reportedBy: 'Officer Juan',
      time: '15 minutes ago',
      status: 'responding' as const,
    },
    {
      id: 2,
      title: 'Noise Complaint - Block 3 Lot 8',
      severity: 'low' as const,
      location: 'Block 3 Lot 8',
      reportedBy: 'Resident',
      time: '2 hours ago',
      status: 'reported' as const,
    },
  ];

  const getIncidentSeverityBadge = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-orange-600">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getActivityIcon = (type: 'entry' | 'exit' | 'incident') => {
    switch (type) {
      case 'entry':
        return <Activity className="h-4 w-4 text-green-600" />;
      case 'exit':
        return <Activity className="h-4 w-4 text-blue-600" />;
      case 'incident':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time gate activity, incident reports, and security monitoring
          </p>
        </div>
      </div>

      {/* Active Incidents Alert */}
      {stats.activeIncidents > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900">
                {stats.activeIncidents} active incident{stats.activeIncidents > 1 ? 's' : ''} requiring attention
              </p>
              <p className="text-sm text-red-700 mt-1">
                Review and respond to ongoing incidents to ensure community safety
              </p>
            </div>
            <Link href="/monitoring/incidents">
              <Button variant="outline" size="sm" className="text-red-900 border-red-300">
                View Incidents
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gate Activity Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.gateActivityToday}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats.gateActivityChange}</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeIncidents}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Incidents</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolvedIncidents}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Gates</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGates}</div>
            <p className="text-xs text-green-600">All operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Incidents</CardTitle>
            <CardDescription>
              Incidents currently being monitored and responded to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{incident.title}</p>
                        {getIncidentSeverityBadge(incident.severity)}
                        <Badge variant="outline">{incident.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {incident.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {incident.reportedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {incident.time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/monitoring/incidents/${incident.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Activity</CardTitle>
          <CardDescription>
            Live feed of gate entries, exits, and security events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{activity.description}</p>
                      {activity.type === 'incident' && activity.severity && (
                        getIncidentSeverityBadge(activity.severity)
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {activity.gate}
                      </span>
                      {activity.guardName && (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {activity.guardName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/monitoring/gates">
          <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Gate Activity Dashboard</CardTitle>
                  <CardDescription>View detailed entry/exit logs and analytics</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.gateActivityToday}</p>
                  <p className="text-xs text-muted-foreground">Logs today</p>
                </div>
                <Button variant="ghost" size="sm">
                  View Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/monitoring/incidents">
          <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Incident Reports</CardTitle>
                  <CardDescription>Manage security incidents and responses</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.activeIncidents}</p>
                  <p className="text-xs text-muted-foreground">Active incidents</p>
                </div>
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Tools</CardTitle>
          <CardDescription>
            Additional monitoring and security management features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              Activity Analytics
            </Button>
            <Button variant="outline" className="justify-start">
              <Camera className="mr-2 h-4 w-4" />
              CCTV Integration
            </Button>
            <Button variant="outline" className="justify-start">
              <Shield className="mr-2 h-4 w-4" />
              Security Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
