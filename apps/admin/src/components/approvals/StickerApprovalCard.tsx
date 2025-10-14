'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Car, MapPin, User, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useApproveStickerMutation } from '@/lib/hooks/use-sticker-mutations';
import { useToast } from '@/components/ui/use-toast';

interface StickerRequest {
  id: string;
  vehicle_plate: string;
  vehicle_make: string | null;
  vehicle_color: string | null;
  sticker_type: string;
  status: string;
  or_cr_document_url: string | null;
  created_at: string;
  household: {
    id: string;
    property: {
      id: string;
      address: string;
      phase: string | null;
      block: string | null;
      lot: string | null;
    };
    household_head: {
      id: string;
      first_name: string;
      last_name: string;
      phone_number: string | null;
    };
  };
}

interface StickerApprovalCardProps {
  request: StickerRequest;
  onApproved?: () => void;
  onRejected?: () => void;
}

export function StickerApprovalCard({ request, onApproved, onRejected }: StickerApprovalCardProps) {
  const { toast } = useToast();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rfidSerial, setRfidSerial] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Use optimistic mutation hook
  const approveMutation = useApproveStickerMutation();

  const handleApprove = async () => {
    if (!rfidSerial.trim()) {
      setError('RFID serial is required');
      return;
    }

    setError(null);

    approveMutation.mutate(
      {
        sticker_id: request.id,
        decision: 'approved',
        rfid_serial: rfidSerial.trim(),
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            setShowApproveDialog(false);
            setRfidSerial('');
            toast({
              title: 'Sticker Approved',
              description: `Vehicle sticker for ${request.vehicle_plate} has been approved.`,
            });
            onApproved?.();
          } else {
            setError(result.error || 'Failed to approve sticker');
          }
        },
        onError: (err) => {
          console.error('Error approving sticker:', err);
          setError(err instanceof Error ? err.message : 'Unexpected error');
          toast({
            title: 'Error',
            description: 'Failed to approve sticker. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleReject = async () => {
    setError(null);

    approveMutation.mutate(
      {
        sticker_id: request.id,
        decision: 'rejected',
        rejection_reason: rejectionReason.trim() || 'Rejected by admin',
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            setShowRejectDialog(false);
            setRejectionReason('');
            toast({
              title: 'Sticker Rejected',
              description: `Vehicle sticker for ${request.vehicle_plate} has been rejected.`,
            });
            onRejected?.();
          } else {
            setError(result.error || 'Failed to reject sticker');
          }
        },
        onError: (err) => {
          console.error('Error rejecting sticker:', err);
          setError(err instanceof Error ? err.message : 'Unexpected error');
          toast({
            title: 'Error',
            description: 'Failed to reject sticker. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                {request.vehicle_plate}
              </CardTitle>
              <CardDescription>
                Requested on {new Date(request.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant="secondary">{request.sticker_type.replace('_', ' ')}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vehicle Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Vehicle Information</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Make:</span>{' '}
                <span className="font-medium">{request.vehicle_make || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Color:</span>{' '}
                <span className="font-medium">{request.vehicle_color || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Household Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Household Information
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Head:</span>
                <span className="font-medium">
                  {request.household.household_head.first_name}{' '}
                  {request.household.household_head.last_name}
                </span>
              </div>
              {request.household.household_head.phone_number && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">
                    {request.household.household_head.phone_number}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{request.household.property.address}</span>
              </div>
              {request.household.property.phase && (
                <div className="text-muted-foreground text-xs">
                  Phase {request.household.property.phase}
                  {request.household.property.block && `, Block ${request.household.property.block}`}
                  {request.household.property.lot && `, Lot ${request.household.property.lot}`}
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          {request.or_cr_document_url && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </h4>
              <a
                href={request.or_cr_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                View OR/CR Document →
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setShowApproveDialog(true)}
              className="flex-1"
              variant="default"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              onClick={() => setShowRejectDialog(true)}
              className="flex-1"
              variant="destructive"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Vehicle Sticker</DialogTitle>
            <DialogDescription>
              Enter the RFID serial number to approve this sticker request for{' '}
              <strong>{request.vehicle_plate}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="rfid_serial">RFID Serial Number *</Label>
              <Input
                id="rfid_serial"
                value={rfidSerial}
                onChange={(e) => setRfidSerial(e.target.value)}
                placeholder="Enter RFID serial (e.g., RFID-123456)"
                disabled={approveMutation.isPending}
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                This serial number will be linked to the vehicle sticker for gate access
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setError(null);
                setRfidSerial('');
              }}
              disabled={approveMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending || !rfidSerial.trim()}>
              {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {approveMutation.isPending ? 'Approving...' : 'Approve Sticker'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Vehicle Sticker</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject the sticker request for{' '}
              <strong>{request.vehicle_plate}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="rejection_reason">Reason for Rejection (Optional)</Label>
              <Input
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Invalid documents, duplicate request"
                disabled={approveMutation.isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setError(null);
                setRejectionReason('');
              }}
              disabled={approveMutation.isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={approveMutation.isPending}>
              {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {approveMutation.isPending ? 'Rejecting...' : 'Reject Sticker'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
