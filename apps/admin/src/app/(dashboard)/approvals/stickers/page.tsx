'use client';

import { useEffect, useState } from 'react';
import { CheckSquare, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { StickerApprovalCard } from '@/components/approvals/StickerApprovalCard';
import { getPendingStickerRequests } from '@/lib/actions/approve-sticker';

export default function StickerApprovalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load pending sticker requests
  useEffect(() => {
    async function loadRequests() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await getPendingStickerRequests();

        if (fetchError) {
          setError(fetchError.message || 'Failed to load sticker requests');
          return;
        }

        setRequests(data || []);
      } catch (err) {
        console.error('Error loading sticker requests:', err);
        setError('Unexpected error loading sticker requests');
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleRequestProcessed = () => {
    // Refresh the list after approval/rejection
    handleRefresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading sticker requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CheckSquare className="h-8 w-8" />
            Vehicle Sticker Approvals
          </h1>
          <p className="text-muted-foreground">
            Review and approve vehicle sticker requests from residents
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Card */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
            <p className="text-3xl font-bold">{requests.length}</p>
          </div>
          <Badge variant={requests.length > 0 ? 'default' : 'secondary'} className="text-lg px-4 py-2">
            {requests.length} {requests.length === 1 ? 'Request' : 'Requests'}
          </Badge>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Requests Grid */}
      {requests.length === 0 ? (
        <Alert>
          <CheckSquare className="h-4 w-4" />
          <AlertTitle>All Caught Up!</AlertTitle>
          <AlertDescription>
            There are no pending vehicle sticker requests at the moment. Check back later or refresh
            to see new requests.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Showing {requests.length} pending request{requests.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <StickerApprovalCard
                key={request.id}
                request={request}
                onApproved={handleRequestProcessed}
                onRejected={handleRequestProcessed}
              />
            ))}
          </div>
        </>
      )}

      {/* Help Section */}
      <Alert>
        <AlertTitle>Approval Guidelines</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
            <li>Verify that the vehicle plate matches the OR/CR document</li>
            <li>Check that the household has available sticker allocation</li>
            <li>Ensure the RFID serial is unique and correctly formatted</li>
            <li>Contact the household head if additional verification is needed</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
