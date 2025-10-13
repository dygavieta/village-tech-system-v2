import {
  ShieldCheck,
  Plus,
  Edit,
  Power,
  MapPin,
  Clock,
  ArrowLeft,
  Settings,
  CheckCircle,
  XCircle,
  Wifi,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function GatesPage() {
  // TODO: Replace with actual data from Supabase
  const stats = {
    totalGates: 3,
    activeGates: 3,
    offlineGates: 0,
    totalScansToday: 1234,
  };

  const gates = [
    {
      id: 1,
      name: 'Main Gate',
      type: 'Vehicle & Pedestrian',
      location: 'North Entrance',
      status: 'online' as const,
      operational: true,
      gpsCoordinates: '14.5995° N, 120.9842° E',
      operatingHours: '24/7',
      rfidReaders: 2,
      cameras: 3,
      lastScan: '2 minutes ago',
      scansToday: 856,
      assignedGuards: ['Officer Juan', 'Officer Maria'],
    },
    {
      id: 2,
      name: 'South Gate',
      type: 'Vehicle Only',
      location: 'South Entrance',
      status: 'online' as const,
      operational: true,
      gpsCoordinates: '14.5965° N, 120.9856° E',
      operatingHours: '6:00 AM - 10:00 PM',
      rfidReaders: 1,
      cameras: 2,
      lastScan: '5 minutes ago',
      scansToday: 245,
      assignedGuards: ['Officer Pedro'],
    },
    {
      id: 3,
      name: 'North Pedestrian Gate',
      type: 'Pedestrian Only',
      location: 'North Side',
      status: 'online' as const,
      operational: true,
      gpsCoordinates: '14.6005° N, 120.9835° E',
      operatingHours: '5:00 AM - 9:00 PM',
      rfidReaders: 1,
      cameras: 1,
      lastScan: '10 minutes ago',
      scansToday: 133,
      assignedGuards: ['Officer Ana'],
    },
  ];

  const getStatusBadge = (status: 'online' | 'offline') => {
    return status === 'online' ? (
      <Badge variant="default" className="bg-green-600">
        <Wifi className="mr-1 h-3 w-3" />
        Online
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="mr-1 h-3 w-3" />
        Offline
      </Badge>
    );
  };

  const getOperationalBadge = (operational: boolean) => {
    return operational ? (
      <Badge variant="default" className="bg-blue-600">
        <CheckCircle className="mr-1 h-3 w-3" />
        Operational
      </Badge>
    ) : (
      <Badge variant="secondary">
        <Power className="mr-1 h-3 w-3" />
        Closed
      </Badge>
    );
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add New Gate
        </Button>
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
            <CardTitle className="text-sm font-medium">Offline Gates</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.offlineGates}</div>
            <p className="text-xs text-muted-foreground">Connectivity issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scans Today</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScansToday}</div>
            <p className="text-xs text-muted-foreground">Total entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Gates List */}
      <div className="space-y-4">
        {gates.map((gate) => (
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
                      {getOperationalBadge(gate.operational)}
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {gate.location}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Gate Type</p>
                  <p className="font-medium">{gate.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Operating Hours</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {gate.operatingHours}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">GPS Coordinates</p>
                  <p className="font-medium text-xs">{gate.gpsCoordinates}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Scans Today</p>
                  <p className="font-medium">{gate.scansToday}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">RFID Readers</p>
                  <p className="font-medium">{gate.rfidReaders} device{gate.rfidReaders > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Cameras</p>
                  <p className="font-medium">{gate.cameras} camera{gate.cameras > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Scan</p>
                  <p className="font-medium">{gate.lastScan}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Assigned Security Guards</p>
                <div className="flex flex-wrap gap-2">
                  {gate.assignedGuards.map((guard, idx) => (
                    <Badge key={idx} variant="outline">
                      {guard}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
