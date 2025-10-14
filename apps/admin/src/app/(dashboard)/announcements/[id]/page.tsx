/**
 * T148: Announcement Detail Page
 * View announcement details with read tracking and acknowledgments
 */

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Calendar, Users, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';

interface AnnouncementDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AnnouncementDetailPage({
  params,
}: AnnouncementDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch announcement details
  const { data: announcement, error } = await supabase
    .from('announcements')
    .select(
      `
      *,
      created_by:user_profiles!created_by_admin_id(full_name, email)
    `
    )
    .eq('id', id)
    .single();

  if (error || !announcement) {
    notFound();
  }

  // Fetch acknowledgment stats if required
  let acknowledgmentStats = null;
  if (announcement.requires_acknowledgment) {
    const { count: acknowledgedCount } = await supabase
      .from('announcement_acknowledgments')
      .select('*', { count: 'exact', head: true })
      .eq('announcement_id', id);

    // Get total target audience count
    let totalTargetCount = 0;
    if (announcement.target_audience === 'all' || announcement.target_audience === 'all_residents') {
      const { count } = await supabase
        .from('households')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', announcement.tenant_id);
      totalTargetCount = count || 0;
    } else if (announcement.target_audience === 'specific_households') {
      totalTargetCount = announcement.specific_household_ids?.length || 0;
    }

    acknowledgmentStats = {
      acknowledged: acknowledgedCount || 0,
      total: totalTargetCount,
      percentage: totalTargetCount > 0 ? Math.round(((acknowledgedCount || 0) / totalTargetCount) * 100) : 0,
    };
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'important':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isActive = () => {
    const now = new Date();
    const start = new Date(announcement.effective_start);
    const end = announcement.effective_end ? new Date(announcement.effective_end) : null;
    return start <= now && (!end || end > now);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link href="/announcements">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{announcement.title}</h1>
          <p className="text-muted-foreground">
            Created {format(new Date(announcement.created_at), 'MMM d, yyyy \'at\' h:mm a')}
          </p>
        </div>
        <Badge variant={isActive() ? 'default' : 'secondary'} className={isActive() ? 'bg-green-600' : ''}>
          {isActive() ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Announcement Details */}
      <Card className={getUrgencyColor(announcement.urgency)}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                <AlertCircle className="mr-1 h-3 w-3" />
                {announcement.urgency.charAt(0).toUpperCase() + announcement.urgency.slice(1)}
              </Badge>
              <Badge variant="outline">{announcement.category}</Badge>
              <Badge variant="outline">
                <Users className="mr-1 h-3 w-3" />
                {announcement.target_audience.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap">{announcement.content}</div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created by:</span>
                <span className="font-medium">{announcement.created_by?.full_name || 'Admin'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Effective Start:</span>
                <span className="font-medium">
                  {format(new Date(announcement.effective_start), 'MMM d, yyyy \'at\' h:mm a')}
                </span>
              </div>
              {announcement.effective_end && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Effective End:</span>
                  <span className="font-medium">
                    {format(new Date(announcement.effective_end), 'MMM d, yyyy \'at\' h:mm a')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acknowledgment Stats */}
      {acknowledgmentStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Acknowledgment Status
            </CardTitle>
            <CardDescription>
              Track who has acknowledged this announcement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {acknowledgmentStats.acknowledged} of {acknowledgmentStats.total} acknowledged
                </span>
                <span className="text-sm text-muted-foreground">
                  {acknowledgmentStats.percentage}%
                </span>
              </div>
              <Progress value={acknowledgmentStats.percentage} className="h-2" />
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {acknowledgmentStats.acknowledged}
                  </p>
                  <p className="text-xs text-muted-foreground">Acknowledged</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {acknowledgmentStats.total - acknowledgmentStats.acknowledged}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Delivery Information
          </CardTitle>
          <CardDescription>
            Announcement delivery details and reach
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-600" />
                <span className="text-sm font-medium">Push Notification</span>
              </div>
              <Badge variant="default" className="bg-green-600">Sent</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-600" />
                <span className="text-sm font-medium">In-App Notification</span>
              </div>
              <Badge variant="default" className="bg-green-600">Delivered</Badge>
            </div>
            {announcement.urgency === 'critical' && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-600" />
                  <span className="text-sm font-medium">SMS Alert</span>
                </div>
                <Badge variant="default" className="bg-green-600">Sent</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline">Edit Announcement</Button>
        <Button variant="outline">Resend Notifications</Button>
        {!isActive() && <Button variant="outline">Reactivate</Button>}
      </div>
    </div>
  );
}
