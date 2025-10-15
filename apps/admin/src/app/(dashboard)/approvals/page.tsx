import {
  CheckSquare,
  Car,
  Construction,
  Clock,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getApprovalStats, getRecentPendingApprovals } from '@/lib/actions/approvals';

export default async function ApprovalsPage() {
  // Fetch real data from database
  const { data: stats, error: statsError } = await getApprovalStats();
  const { data: pendingApprovals, error: approvalsError } = await getRecentPendingApprovals(10);

  // Handle errors
  if (statsError || approvalsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
            <p className="text-muted-foreground">
              Review and approve pending vehicle stickers and construction permits
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <p>Failed to load approval data: {statsError || approvalsError}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use empty defaults if data is not available
  const approvalStats = stats || {
    totalPending: 0,
    stickerRequests: 0,
    permitRequests: 0,
    avgResponseTime: 'N/A',
  };

  const approvalsList = pendingApprovals || [];

  const getTypeIcon = (type: 'sticker' | 'permit') => {
    return type === 'sticker' ? (
      <Car className="h-4 w-4" />
    ) : (
      <Construction className="h-4 w-4" />
    );
  };

  const getPriorityBadge = (priority: 'high' | 'normal') => {
    return priority === 'high' ? (
      <Badge variant="destructive" className="text-xs">
        High Priority
      </Badge>
    ) : null;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve pending vehicle stickers and construction permits
          </p>
        </div>
      </div>

      {/* Alert for pending approvals */}
      {approvalStats.totalPending > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-orange-900">
                {approvalStats.totalPending} pending approval{approvalStats.totalPending > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-orange-700 mt-1">
                {approvalStats.stickerRequests} vehicle sticker request{approvalStats.stickerRequests > 1 ? 's' : ''} and{' '}
                {approvalStats.permitRequests} construction permit{approvalStats.permitRequests > 1 ? 's' : ''} awaiting your review
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvalStats.totalPending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sticker Requests</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvalStats.stickerRequests}</div>
            <p className="text-xs text-muted-foreground">Vehicle stickers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permit Requests</CardTitle>
            <Construction className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvalStats.permitRequests}</div>
            <p className="text-xs text-muted-foreground">Construction permits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvalStats.avgResponseTime}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>
            All requests awaiting your review and approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approvalsList.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">
                There are no pending approvals at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvalsList.map((approval) => (
                <div
                  key={approval.id}
                  className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {getTypeIcon(approval.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{approval.title}</p>
                        {getPriorityBadge(approval.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {approval.household}
                      </p>
                      <p className="text-sm mt-1">{approval.details}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                        <Clock className="h-3 w-3" />
                        Submitted {approval.submittedAt}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={
                      approval.type === 'sticker'
                        ? '/approvals/stickers'
                        : '/approvals/permits'
                    }
                  >
                    <Button variant="outline" size="sm">
                      Review
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Access Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/approvals/stickers">
          <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Car className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Vehicle Sticker Approvals</CardTitle>
                  <CardDescription>Review and approve vehicle sticker requests</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-end">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/approvals/permits">
          <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                  <Construction className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Construction Permit Approvals</CardTitle>
                  <CardDescription>Review and approve construction permits</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-end">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
