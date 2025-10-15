import {
  Car,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStickersByStatus, getStickerStats, getActiveStickers } from '@/lib/actions/approve-sticker';
import { StickerApprovalCard } from '@/components/approvals/StickerApprovalCard';
import { StickerDisplayCard } from '@/components/approvals/StickerDisplayCard';

export default async function VehicleStickersPage() {
  // Fetch all sticker data
  const { data: pendingStickers, error: pendingError } = await getStickersByStatus('pending');
  const { data: approvedStickers, error: approvedError } = await getActiveStickers();
  const { data: rejectedStickers, error: rejectedError } = await getStickersByStatus('rejected');
  const { data: statsData, error: statsError } = await getStickerStats();

  // Use real stats from database
  const stats = statsData || {
    totalPending: 0,
    approved: 0,
    rejected: 0,
    avgProcessingTime: 'N/A',
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
            <h1 className="text-3xl font-bold tracking-tight">Vehicle Stickers</h1>
            <p className="text-muted-foreground">
              Review and manage vehicle sticker requests
            </p>
          </div>
        </div>
      </div>

      {/* Alert for pending stickers */}
      {stats.totalPending > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-orange-900">
                {stats.totalPending} sticker request{stats.totalPending > 1 ? 's' : ''} awaiting your review
              </p>
              <p className="text-sm text-orange-700 mt-1">
                Review vehicle details, verify documents, and approve stickers to grant vehicle access
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
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProcessingTime}</div>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Error */}
      {statsError && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              <p>Warning: Failed to load statistics: {statsError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different statuses */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingStickers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedStickers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedStickers?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-6">
          {pendingError && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <p>Failed to load pending stickers: {typeof pendingError === 'string' ? pendingError : pendingError?.message || 'Unknown error'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!pendingError && (!pendingStickers || pendingStickers.length === 0) && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Pending Stickers</h3>
                  <p className="text-muted-foreground">
                    There are no vehicle sticker requests awaiting your review.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {!pendingError && pendingStickers && pendingStickers.length > 0 && (
            <>
              <div>
                <h2 className="text-xl font-semibold mb-4">Pending Vehicle Stickers</h2>
                <p className="text-muted-foreground mb-6">
                  Review vehicle details, verify OR/CR documents, and assign RFID serials
                </p>
              </div>
              <div className="grid gap-6">
                {pendingStickers.map((sticker: any) => (
                  <StickerApprovalCard
                    key={sticker.id}
                    request={sticker}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved" className="space-y-6">
          {approvedError && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <p>Failed to load approved stickers: {typeof approvedError === 'string' ? approvedError : approvedError?.message || 'Unknown error'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!approvedError && (!approvedStickers || approvedStickers.length === 0) && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Approved Stickers</h3>
                  <p className="text-muted-foreground">
                    No vehicle stickers have been approved yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {!approvedError && approvedStickers && approvedStickers.length > 0 && (
            <>
              <div>
                <h2 className="text-xl font-semibold mb-4">Approved Vehicle Stickers</h2>
                <p className="text-muted-foreground mb-6">
                  View approved stickers with assigned RFID serials
                </p>
              </div>
              <div className="grid gap-6">
                {approvedStickers.map((sticker: any) => (
                  <StickerDisplayCard
                    key={sticker.id}
                    sticker={sticker}
                    status="approved"
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected" className="space-y-6">
          {rejectedError && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <p>Failed to load rejected stickers: {typeof rejectedError === 'string' ? rejectedError : rejectedError?.message || 'Unknown error'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!rejectedError && (!rejectedStickers || rejectedStickers.length === 0) && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Rejected Stickers</h3>
                  <p className="text-muted-foreground">
                    No vehicle sticker requests have been rejected.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {!rejectedError && rejectedStickers && rejectedStickers.length > 0 && (
            <>
              <div>
                <h2 className="text-xl font-semibold mb-4">Rejected Vehicle Stickers</h2>
                <p className="text-muted-foreground mb-6">
                  View rejected sticker requests with rejection reasons
                </p>
              </div>
              <div className="grid gap-6">
                {rejectedStickers.map((sticker: any) => (
                  <StickerDisplayCard
                    key={sticker.id}
                    sticker={sticker}
                    status="rejected"
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Sticker Guidelines</CardTitle>
          <CardDescription>
            Important information for reviewing vehicle sticker requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Verify Documents</p>
                <p className="text-muted-foreground">Ensure vehicle plate matches OR/CR documents</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Check Allocation</p>
                <p className="text-muted-foreground">Verify household has not exceeded sticker allocation limit</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">RFID Assignment</p>
                <p className="text-muted-foreground">Ensure RFID serial is unique and correctly formatted</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Contact Resident</p>
                <p className="text-muted-foreground">Reach out if additional verification is needed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
