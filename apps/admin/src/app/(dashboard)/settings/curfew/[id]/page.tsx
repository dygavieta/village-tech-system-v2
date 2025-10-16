import {
  Clock,
  ArrowLeft,
  Calendar,
  CheckCircle,
  AlertCircle,
  User,
  Edit,
  Sun,
  Snowflake,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCurfewById } from '@/lib/actions/curfew';
import { formatDistanceToNow } from 'date-fns';
import CurfewExceptionsCard from '@/components/curfew/CurfewExceptionsCard';
import DeleteCurfewButton from '@/components/curfew/DeleteCurfewButton';

export default async function CurfewDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const curfew = await getCurfewById(params.id);

  if (!curfew) {
    notFound();
  }

  const getSeasonIcon = () => {
    switch (curfew.season) {
      case 'summer':
        return <Sun className="h-5 w-5 text-orange-500" />;
      case 'winter':
        return <Snowflake className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getSeasonLabel = () => {
    switch (curfew.season) {
      case 'all_year':
        return 'All Year Round';
      case 'summer':
        return 'Summer Only';
      case 'winter':
        return 'Winter Only';
      case 'custom':
        return 'Custom Season';
      default:
        return curfew.season;
    }
  };

  const formatDays = (days: string[]) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) {
      return 'Weekdays (Mon-Fri)';
    }
    if (days.length === 2 && days.includes('saturday') && days.includes('sunday')) {
      return 'Weekends (Sat-Sun)';
    }
    return days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings/curfew">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Curfew Settings
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/settings/curfew/${curfew.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <DeleteCurfewButton curfewId={curfew.id} curfewName={curfew.name} />
        </div>
      </div>

      {/* Curfew Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl">{curfew.name}</CardTitle>
                  <Badge variant={curfew.is_active ? 'default' : 'secondary'}>
                    {curfew.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription className="text-base">
                  Created {formatDistanceToNow(new Date(curfew.created_at), { addSuffix: true })}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Curfew Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Description */}
        {curfew.description && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{curfew.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Time & Days */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Curfew Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Time Window</p>
              <p className="text-2xl font-bold">
                {curfew.start_time} - {curfew.end_time}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Days of Week</p>
              <p className="text-sm">{formatDays(curfew.days_of_week)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Season & Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Season & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Season</p>
              <div className="flex items-center gap-2">
                {getSeasonIcon()}
                <p className="text-sm">{getSeasonLabel()}</p>
              </div>
              {curfew.season === 'custom' && curfew.season_start_date && curfew.season_end_date && (
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(curfew.season_start_date).toLocaleDateString()} - {new Date(curfew.season_end_date).toLocaleDateString()}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
              <div className="flex items-center gap-2">
                {curfew.is_active ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm">Active - Currently enforced at gates</p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">Inactive - Not currently enforced</p>
                  </>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Created By</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <p className="text-sm">{curfew.admin_name}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Last Updated</p>
              <p className="text-sm">
                {formatDistanceToNow(new Date(curfew.updated_at), { addSuffix: true })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exceptions */}
      <CurfewExceptionsCard curfewId={curfew.id} />

      {/* Status Info */}
      {!curfew.is_active && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900">Inactive Status</p>
                <p className="text-sm text-orange-700 mt-1">
                  This curfew is currently inactive and is not being enforced at gates.
                  Edit the curfew to activate it.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {curfew.is_active && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Active Curfew</p>
                <p className="text-sm text-green-700 mt-1">
                  This curfew is currently active and enforced at all gates. Security officers will be alerted
                  for any entries during curfew hours on the specified days.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
