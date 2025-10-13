import {
  Clock,
  Calendar,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CurfewSettingsPage() {
  // TODO: Replace with actual data from Supabase
  const curfewSettings = {
    enabled: true,
    startTime: '10:00 PM',
    endTime: '6:00 AM',
    strictMode: false,
    notifyResidents: true,
    notifyGuards: true,
  };

  const exceptions = [
    {
      id: 1,
      name: 'Weekend Extension',
      description: 'Extended curfew hours for Friday and Saturday nights',
      startTime: '12:00 AM',
      endTime: '6:00 AM',
      days: ['Friday', 'Saturday'],
      active: true,
    },
    {
      id: 2,
      name: 'Holiday Season',
      description: 'Relaxed curfew for December holidays',
      startTime: '1:00 AM',
      endTime: '6:00 AM',
      dateRange: 'Dec 20 - Jan 5',
      active: true,
    },
  ];

  const seasonalAdjustments = [
    {
      id: 1,
      season: 'Summer (March - May)',
      startTime: '11:00 PM',
      endTime: '5:00 AM',
      reason: 'Hot weather, late evening activities',
      active: false,
    },
    {
      id: 2,
      season: 'Rainy Season (June - October)',
      startTime: '9:00 PM',
      endTime: '6:00 AM',
      reason: 'Early darkness, safety concerns',
      active: false,
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
            <h1 className="text-3xl font-bold tracking-tight">Curfew Settings</h1>
            <p className="text-muted-foreground">
              Set curfew hours, exceptions, and seasonal adjustments
            </p>
          </div>
        </div>
      </div>

      {/* Current Curfew Status */}
      <Card className={curfewSettings.enabled ? 'border-blue-200 bg-blue-50' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Current Curfew Policy
              </CardTitle>
              <CardDescription className="mt-1">
                Active community curfew hours
              </CardDescription>
            </div>
            <Badge variant={curfewSettings.enabled ? 'default' : 'secondary'} className={curfewSettings.enabled ? 'bg-blue-600' : ''}>
              {curfewSettings.enabled ? (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Enabled
                </>
              ) : (
                'Disabled'
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                <Moon className="h-7 w-7 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Curfew Starts</p>
                <p className="text-2xl font-bold">{curfewSettings.startTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
                <Sun className="h-7 w-7 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Curfew Ends</p>
                <p className="text-2xl font-bold">{curfewSettings.endTime}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Strict Mode (No Exceptions)</span>
              </div>
              <Badge variant={curfewSettings.strictMode ? 'default' : 'secondary'}>
                {curfewSettings.strictMode ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Notify Residents</span>
              </div>
              <Badge variant={curfewSettings.notifyResidents ? 'default' : 'secondary'}>
                {curfewSettings.notifyResidents ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Notify Security Guards</span>
              </div>
              <Badge variant={curfewSettings.notifyGuards ? 'default' : 'secondary'}>
                {curfewSettings.notifyGuards ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>

          <div className="mt-6">
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Curfew Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exceptions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Curfew Exceptions</CardTitle>
              <CardDescription>
                Special curfew hours for specific days or date ranges
              </CardDescription>
            </div>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Exception
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exceptions.map((exception) => (
              <div
                key={exception.id}
                className="flex items-start justify-between border rounded-lg p-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{exception.name}</p>
                      <Badge variant={exception.active ? 'default' : 'secondary'}>
                        {exception.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{exception.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {exception.startTime} - {exception.endTime}
                      </span>
                      {exception.days && (
                        <span>
                          Days: {exception.days.join(', ')}
                        </span>
                      )}
                      {exception.dateRange && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {exception.dateRange}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Adjustments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Seasonal Adjustments</CardTitle>
              <CardDescription>
                Automatic curfew adjustments based on seasons
              </CardDescription>
            </div>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Adjustment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {seasonalAdjustments.map((adjustment) => (
              <div
                key={adjustment.id}
                className="flex items-start justify-between border rounded-lg p-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                    <Sun className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{adjustment.season}</p>
                      <Badge variant={adjustment.active ? 'default' : 'secondary'}>
                        {adjustment.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{adjustment.reason}</p>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      <span>{adjustment.startTime} - {adjustment.endTime}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
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
          <CardTitle>Curfew Management Guidelines</CardTitle>
          <CardDescription>
            Best practices for setting and enforcing curfew hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Reasonable Hours</p>
                <p className="text-muted-foreground">Set curfew hours that balance community peace with resident freedom</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Clear Communication</p>
                <p className="text-muted-foreground">Ensure all residents are notified of curfew policies and changes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Flexible Exceptions</p>
                <p className="text-muted-foreground">Create exceptions for special occasions and seasonal needs</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
