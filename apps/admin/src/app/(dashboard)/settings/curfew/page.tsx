import {
  Clock,
  Plus,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  Eye,
  Edit,
  Sun,
  Snowflake,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCurfews, getCurfewStats } from '@/lib/actions/curfew';
import { formatDistanceToNow } from 'date-fns';

export default async function CurfewSettingsPage() {
  const [stats, curfews] = await Promise.all([
    getCurfewStats(),
    getCurfews(),
  ]);

  const getSeasonIcon = (season: string) => {
    switch (season) {
      case 'summer':
        return <Sun className="h-3 w-3" />;
      case 'winter':
        return <Snowflake className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getSeasonLabel = (season: string) => {
    switch (season) {
      case 'all_year':
        return 'All Year';
      case 'summer':
        return 'Summer';
      case 'winter':
        return 'Winter';
      case 'custom':
        return 'Custom Season';
      default:
        return season;
    }
  };

  const formatDays = (days: string[]) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) {
      return 'Weekdays';
    }
    if (days.length === 2 && days.includes('saturday') && days.includes('sunday')) {
      return 'Weekends';
    }
    return days.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ');
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
            <h1 className="text-3xl font-bold tracking-tight">Curfew Settings</h1>
            <p className="text-muted-foreground">
              Manage curfew hours, exceptions, and seasonal adjustments
            </p>
          </div>
        </div>
        <Link href="/settings/curfew/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Curfew
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Curfew Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.enabled ? 'Enabled' : 'Disabled'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCurfews} active {stats.activeCurfews === 1 ? 'curfew' : 'curfews'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Curfews</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCurfews}</div>
            <p className="text-xs text-muted-foreground">All configured curfews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactiveCurfews}</div>
            <p className="text-xs text-muted-foreground">Disabled curfews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exceptions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExceptions}</div>
            <p className="text-xs text-muted-foreground">Holiday/event exceptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Status */}
      <Card className={stats.enabled ? 'border-blue-200 bg-blue-50' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Curfew Status
              </CardTitle>
              <CardDescription className="mt-1">
                {stats.enabled
                  ? 'Curfew hours are currently enforced in your community'
                  : 'No active curfews configured'}
              </CardDescription>
            </div>
            <Badge variant={stats.enabled ? 'default' : 'secondary'} className={stats.enabled ? 'bg-blue-600' : ''}>
              {stats.enabled ? (
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
        {stats.enabled && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              There {stats.activeCurfews === 1 ? 'is' : 'are'} currently {stats.activeCurfews} active curfew{' '}
              {stats.activeCurfews === 1 ? '' : 's'} being enforced at gates. View details below.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Curfews List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configured Curfews</CardTitle>
              <CardDescription>
                All curfew configurations for your community
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {curfews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No curfews configured</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create curfew hours to manage community access control
              </p>
              <Link href="/settings/curfew/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Curfew
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {curfews.map((curfew) => {
                return (
                  <div
                    key={curfew.id}
                    className="flex items-start justify-between border rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{curfew.name}</p>
                          <Badge variant={curfew.is_active ? 'default' : 'secondary'}>
                            {curfew.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {curfew.season !== 'all_year' && (
                            <Badge variant="outline">
                              {getSeasonIcon(curfew.season)}
                              <span className="ml-1">{getSeasonLabel(curfew.season)}</span>
                            </Badge>
                          )}
                        </div>
                        {curfew.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {curfew.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {curfew.start_time} - {curfew.end_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDays(curfew.days_of_week)}
                          </span>
                          <span>By: {curfew.admin_name}</span>
                          <span>
                            Created {formatDistanceToNow(new Date(curfew.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/settings/curfew/${curfew.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/settings/curfew/${curfew.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                <p className="font-medium">Clear Time Windows</p>
                <p className="text-muted-foreground">
                  Set specific start and end times for curfew hours (e.g., 10:00 PM to 6:00 AM)
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Day-Specific Rules</p>
                <p className="text-muted-foreground">
                  Configure different curfew hours for weekdays vs. weekends if needed
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Seasonal Adjustments</p>
                <p className="text-muted-foreground">
                  Create season-specific curfews for summer/winter or custom date ranges
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Exception Dates</p>
                <p className="text-muted-foreground">
                  Add exceptions for holidays, community events, or special occasions when curfew doesn't apply
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
