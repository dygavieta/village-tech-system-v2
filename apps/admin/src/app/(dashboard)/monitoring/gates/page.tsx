import {
  Activity,
  ArrowLeft,
  Download,
  Filter,
  Search,
  Clock,
  MapPin,
  Shield,
  Car,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function GateActivityDashboardPage() {
  // TODO: Replace with actual data from Supabase
  const stats = {
    entriesToday: 856,
    exitsToday: 742,
    activeVisitors: 23,
    peakHour: '8:00 AM',
  };

  const gateActivity = [
    {
      id: 1,
      gate: 'Main Gate',
      entries: 856,
      exits: 742,
      currentOccupancy: 114,
      peakTime: '8:00 AM',
      status: 'online' as const,
    },
    {
      id: 2,
      gate: 'South Gate',
      entries: 245,
      exits: 198,
      currentOccupancy: 47,
      peakTime: '7:30 AM',
      status: 'online' as const,
    },
    {
      id: 3,
      gate: 'North Pedestrian Gate',
      entries: 133,
      exits: 89,
      currentOccupancy: 44,
      peakTime: '6:00 PM',
      status: 'online' as const,
    },
  ];

  const recentLogs = [
    {
      id: 1,
      type: 'entry' as const,
      gate: 'Main Gate',
      vehicle: 'ABC 1234',
      resident: 'Juan Dela Cruz',
      address: 'Block 5 Lot 12',
      method: 'RFID Scan',
      guard: 'Officer Juan',
      time: '2 minutes ago',
    },
    {
      id: 2,
      type: 'exit' as const,
      gate: 'Main Gate',
      vehicle: 'XYZ 5678',
      resident: 'Maria Santos',
      address: 'Block 3 Lot 8',
      method: 'RFID Scan',
      guard: 'Officer Juan',
      time: '5 minutes ago',
    },
    {
      id: 3,
      type: 'entry' as const,
      gate: 'South Gate',
      vehicle: 'DEF 9012',
      resident: 'Guest - Pedro Garcia',
      address: 'Block 7 Lot 15',
      method: 'Pre-registered',
      guard: 'Officer Pedro',
      time: '8 minutes ago',
    },
    {
      id: 4,
      type: 'entry' as const,
      gate: 'North Pedestrian Gate',
      vehicle: 'N/A',
      resident: 'Anna Reyes',
      address: 'Block 2 Lot 5',
      method: 'Manual Entry',
      guard: 'Officer Ana',
      time: '10 minutes ago',
    },
    {
      id: 5,
      type: 'exit' as const,
      gate: 'Main Gate',
      vehicle: 'GHI 3456',
      resident: 'Carlos Mendoza',
      address: 'Block 8 Lot 20',
      method: 'RFID Scan',
      guard: 'Officer Juan',
      time: '12 minutes ago',
    },
  ];

  const getTypeBadge = (type: 'entry' | 'exit') => {
    return type === 'entry' ? (
      <Badge variant="default" className="bg-green-600">
        Entry
      </Badge>
    ) : (
      <Badge variant="default" className="bg-blue-600">
        Exit
      </Badge>
    );
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
            <h1 className="text-3xl font-bold tracking-tight">Gate Activity Dashboard</h1>
            <p className="text-muted-foreground">
              Detailed entry/exit logs and analytics
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entries Today</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.entriesToday}</div>
            <p className="text-xs text-muted-foreground">Vehicles entered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exits Today</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.exitsToday}</div>
            <p className="text-xs text-muted-foreground">Vehicles exited</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeVisitors}</div>
            <p className="text-xs text-muted-foreground">Currently inside</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.peakHour}</div>
            <p className="text-xs text-muted-foreground">Busiest time</p>
          </CardContent>
        </Card>
      </div>

      {/* Gate Activity by Location */}
      <Card>
        <CardHeader>
          <CardTitle>Activity by Gate</CardTitle>
          <CardDescription>
            Entry and exit statistics for each gate location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gateActivity.map((gate) => (
              <div
                key={gate.id}
                className="border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{gate.gate}</p>
                      <Badge variant="default" className="bg-green-600 mt-1">
                        {gate.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Current Occupancy</p>
                    <p className="text-2xl font-bold">{gate.currentOccupancy}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="border rounded p-3">
                    <p className="text-2xl font-bold text-green-600">{gate.entries}</p>
                    <p className="text-xs text-muted-foreground">Entries</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="text-2xl font-bold text-blue-600">{gate.exits}</p>
                    <p className="text-xs text-muted-foreground">Exits</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="text-sm font-bold">{gate.peakTime}</p>
                    <p className="text-xs text-muted-foreground">Peak Time</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Entry/Exit Logs</CardTitle>
          <CardDescription>
            Complete record of all gate activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, vehicle plate, or address..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Date Range
            </Button>
          </div>

          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between border rounded-lg p-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    log.type === 'entry' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <Activity className={`h-5 w-5 ${
                      log.type === 'entry' ? 'text-green-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{log.resident}</p>
                      {getTypeBadge(log.type)}
                      <Badge variant="outline" className="text-xs">
                        {log.method}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {log.gate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {log.vehicle}
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {log.guard}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {log.time}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{log.address}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
