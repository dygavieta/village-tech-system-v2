import {
  Construction,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPendingPermitRequests } from '@/lib/actions/approve-permit';
import { PermitApprovalCard } from '@/components/approvals/PermitApprovalCard';

export default async function ConstructionPermitsPage() {
  // Fetch actual data from Supabase
  const { data: pendingPermits, error } = await getPendingPermitRequests();

  // TODO: Calculate real stats from database
  const stats = {
    totalPending: pendingPermits?.length || 0,
    approved: 12,
    rejected: 2,
    avgProcessingTime: '36 hours',
  };


  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/approvals">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Construction Permits</h1>
            <p className="text-muted-foreground">
              Review and approve construction permit requests
            </p>
          </div>
        </div>
      </div>

      {/* Alert for pending permits */}
      {stats.totalPending > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-orange-900">
                {stats.totalPending} permit request{stats.totalPending > 1 ? 's' : ''} awaiting your review
              </p>
              <p className="text-sm text-orange-700 mt-1">
                Review project details, verify documentation, and approve permits to allow construction work to begin
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <Construction className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProcessingTime}</div>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Permits List */}
      <div className="space-y-6">
        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <p>Failed to load pending permits: {typeof error === 'string' ? error : error?.message || 'Unknown error'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!error && pendingPermits && pendingPermits.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Construction className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Pending Permits</h3>
                <p className="text-muted-foreground">
                  There are no construction permit requests awaiting your review.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!error && pendingPermits && pendingPermits.length > 0 && (
          <>
            <div>
              <h2 className="text-xl font-semibold mb-4">Pending Construction Permits</h2>
              <p className="text-muted-foreground mb-6">
                Review project details, documentation, and approve or reject permits
              </p>
            </div>
            <div className="grid gap-6">
              {pendingPermits.map((permit: any) => (
                <PermitApprovalCard
                  key={permit.id}
                  request={permit}
                  onApproved={() => {
                    // Refresh the page to show updated data
                    window.location.reload();
                  }}
                  onRejected={() => {
                    // Refresh the page to show updated data
                    window.location.reload();
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Construction Permit Guidelines</CardTitle>
          <CardDescription>
            Important information for reviewing construction permits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Required Documents</p>
                <p className="text-muted-foreground">Verify all required documents are attached and valid</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Project Timeline</p>
                <p className="text-muted-foreground">Ensure timeline is reasonable and doesn't conflict with community events</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Road Fee Calculation</p>
                <p className="text-muted-foreground">Verify fee calculation based on project scope and duration</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Worker Registration</p>
                <p className="text-muted-foreground">Ensure all workers are registered with valid IDs</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
