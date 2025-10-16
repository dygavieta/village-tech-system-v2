import {
  ShieldCheck,
  Plus,
  Edit,
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getGates, getGateStats } from '@/lib/actions/gates';
import { formatDistanceToNow } from 'date-fns';

export default async function GatesPage() {
  const [stats, gates] = await Promise.all([
    getGateStats(),
    getGates(),
  ]);

  const getGateTypeLabel = (type: string) => {
    switch (type) {
      case 'primary':
        return 'Primary Gate';
      case 'secondary':
        return 'Secondary Gate';
      case 'service':
        return 'Service Gate';
      case 'emergency':
        return 'Emergency Gate';
      default:
        return type;
    }
  };

  const formatOperatingHours = (start: string | null, end: string | null) => {
    if (!start || !end) return '24/7';
    return `${start} - ${end}`;
  };

  const formatGpsCoordinates = (lat: number | null, lng: number | null) => {
    if (!lat || !lng) return 'Not configured';
    return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
  };

  const getStatusBadge = (status: 'active' | 'inactive' | 'maintenance') => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="secondary">
            <XCircle className="mr-1 h-3 w-3" />
            Inactive
          </Badge>
        );
      case 'maintenance':
        return (
          <Badge variant="default" className="bg-orange-600">
            <AlertCircle className="mr-1 h-3 w-3" />
            Maintenance
          </Badge>
        );
    }
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Gates & Access Control</h1>
            <p className="text-muted-foreground">
              Configure gates, operating hours, and security settings
            </p>
          </div>
        </div>
        <Link href="/settings/gates/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Gate
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gates</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGates}</div>
            <p className="text-xs text-muted-foreground">Access points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Gates</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeGates}</div>
            <p className="text-xs text-green-600">All operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maintenanceGates}</div>
            <p className="text-xs text-muted-foreground">Under maintenance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scans Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScansToday}</div>
            <p className="text-xs text-muted-foreground">Total entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Gates List */}
      <div className="space-y-4">
        {gates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No gates configured</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first gate to start managing access control
              </p>
              <Link href="/settings/gates/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Gate
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          gates.map((gate) => (
            <Card key={gate.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-xl">{gate.name}</CardTitle>
                        {getStatusBadge(gate.status)}
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {getGateTypeLabel(gate.gate_type)}
                      </CardDescription>
                    </div>
                  </div>
                  <Link href={`/settings/gates/${gate.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Gate Type</p>
                    <p className="font-medium">{getGateTypeLabel(gate.gate_type)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Operating Hours</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatOperatingHours(gate.operating_hours_start, gate.operating_hours_end)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">GPS Coordinates</p>
                    <p className="font-medium text-xs">{formatGpsCoordinates(gate.gps_lat, gate.gps_lng)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Scans Today</p>
                    <p className="font-medium">{gate.scans_today || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">RFID Reader Serial</p>
                    <p className="font-medium text-xs">{gate.rfid_reader_serial || 'Not configured'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Last Scan</p>
                    <p className="font-medium">
                      {gate.last_scan ? formatDistanceToNow(new Date(gate.last_scan), { addSuffix: true }) : 'No scans yet'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Configuration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Gate Configuration Guidelines</CardTitle>
          <CardDescription>
            Important information for managing gate settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Operating Hours</p>
                <p className="text-muted-foreground">Set appropriate operating hours based on gate type and security requirements</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">RFID Reader Assignment</p>
                <p className="text-muted-foreground">Ensure all RFID readers are properly configured and tested</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Guard Assignment</p>
                <p className="text-muted-foreground">Assign security officers to gates based on shift schedules</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Connectivity Monitoring</p>
                <p className="text-muted-foreground">Regularly check gate connectivity status and address offline issues immediately</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
