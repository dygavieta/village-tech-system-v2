import {
  AlertTriangle,
  ArrowLeft,
  Plus,
  Eye,
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  FileText,
  Camera,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function IncidentReportsPage() {
  // TODO: Replace with actual data from Supabase
  const stats = {
    activeIncidents: 2,
    resolvedToday: 5,
    totalThisMonth: 18,
    avgResponseTime: '8 minutes',
  };

  const incidents = [
    {
      id: 1,
      title: 'Suspicious Person at South Gate',
      description: 'Unidentified person attempting to enter without authorization. Security detained for verification.',
      severity: 'high' as const,
      status: 'responding' as const,
      location: 'South Gate',
      reportedBy: 'Officer Juan',
      reportedAt: '15 minutes ago',
      respondedAt: null,
      resolvedAt: null,
      photos: 2,
      witnesses: 1,
    },
    {
      id: 2,
      title: 'Noise Complaint - Block 3 Lot 8',
      description: 'Multiple residents reported loud music from Block 3 Lot 8 during curfew hours.',
      severity: 'low' as const,
      status: 'reported' as const,
      location: 'Block 3 Lot 8',
      reportedBy: 'Resident',
      reportedAt: '2 hours ago',
      respondedAt: null,
      resolvedAt: null,
      photos: 0,
      witnesses: 3,
    },
    {
      id: 3,
      title: 'Vehicle Accident - Main Gate',
      description: 'Minor vehicle collision near main gate entrance. No injuries reported. Awaiting insurance assessment.',
      severity: 'medium' as const,
      status: 'resolved' as const,
      location: 'Main Gate',
      reportedBy: 'Officer Maria',
      reportedAt: '3 hours ago',
      respondedAt: '3 hours ago',
      resolvedAt: '1 hour ago',
      photos: 5,
      witnesses: 2,
      resolution: 'Insurance contacted, vehicles removed, incident documented.',
    },
    {
      id: 4,
      title: 'Lost Child - Playground Area',
      description: 'Young child found wandering alone near playground. Parents located and reunited.',
      severity: 'high' as const,
      status: 'resolved' as const,
      location: 'Playground',
      reportedBy: 'Officer Ana',
      reportedAt: '5 hours ago',
      respondedAt: '5 hours ago',
      resolvedAt: '4 hours ago',
      photos: 0,
      witnesses: 4,
      resolution: 'Child safely returned to parents. Reminded parents about supervision policy.',
    },
    {
      id: 5,
      title: 'Unauthorized Construction Work',
      description: 'Construction work observed without valid permit at Block 7 Lot 15. Work halted pending verification.',
      severity: 'medium' as const,
      status: 'resolved' as const,
      location: 'Block 7 Lot 15',
      reportedBy: 'Officer Pedro',
      reportedAt: '1 day ago',
      respondedAt: '1 day ago',
      resolvedAt: '6 hours ago',
      photos: 3,
      witnesses: 1,
      resolution: 'Permit verified and approved. Household reminded of permit display requirements.',
    },
  ];

  const getSeverityBadge = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-orange-600">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getStatusBadge = (status: 'reported' | 'responding' | 'resolved') => {
    switch (status) {
      case 'reported':
        return (
          <Badge variant="secondary">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Reported
          </Badge>
        );
      case 'responding':
        return (
          <Badge variant="default" className="bg-blue-600">
            <Clock className="mr-1 h-3 w-3" />
            Responding
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Resolved
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/monitoring">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Incident Reports</h1>
            <p className="text-muted-foreground">
              Manage security incidents and responses
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Incident
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeIncidents}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolvedToday}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalThisMonth}</div>
            <p className="text-xs text-muted-foreground">Total incidents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}</div>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>
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
          </div>
        </div>
      )}

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle>All Incident Reports</CardTitle>
          <CardDescription>
            Complete history of security incidents and their resolutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="border rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      incident.severity === 'high'
                        ? 'bg-red-100'
                        : incident.severity === 'medium'
                        ? 'bg-orange-100'
                        : 'bg-gray-100'
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${
                        incident.severity === 'high'
                          ? 'text-red-600'
                          : incident.severity === 'medium'
                          ? 'text-orange-600'
                          : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{incident.title}</p>
                        {getSeverityBadge(incident.severity)}
                        {getStatusBadge(incident.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
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
                          {incident.reportedAt}
                        </span>
                        {incident.photos > 0 && (
                          <span className="flex items-center gap-1">
                            <Camera className="h-3 w-3" />
                            {incident.photos} photo{incident.photos > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {incident.resolution && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm font-medium text-green-900 mb-1">Resolution</p>
                          <p className="text-sm text-green-800">{incident.resolution}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Management Guidelines</CardTitle>
          <CardDescription>
            Best practices for handling security incidents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Immediate Response</p>
                <p className="text-muted-foreground">Respond to high-severity incidents within 2 minutes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Documentation</p>
                <p className="text-muted-foreground">Always document incidents with photos, witness statements, and detailed descriptions</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Follow-up</p>
                <p className="text-muted-foreground">Ensure all incidents are resolved and documented before closing</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Communication</p>
                <p className="text-muted-foreground">Keep affected residents informed of incident status and resolution</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
