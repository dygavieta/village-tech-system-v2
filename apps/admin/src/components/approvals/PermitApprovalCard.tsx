'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Construction, MapPin, User, Calendar, FileText, CheckCircle2, XCircle, Loader2, DollarSign, Users, Clock } from 'lucide-react';
import { useApprovePermitMutation } from '@/lib/hooks/use-permit-mutations';
import { useToast } from '@/components/ui/use-toast';

interface ConstructionPermitRequest {
  id: string;
  project_type: string;
  description: string;
  start_date: string;
  duration_days: number;
  contractor_name: string | null;
  contractor_license_url: string | null;
  num_workers: number;
  materials_description: string | null;
  road_fee_amount: number;
  payment_status: string;
  permit_status: string;
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

interface PermitApprovalCardProps {
  request: ConstructionPermitRequest;
  onApproved?: () => void;
  onRejected?: () => void;
}

export function PermitApprovalCard({ request, onApproved, onRejected }: PermitApprovalCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [roadFeeAmount, setRoadFeeAmount] = useState(request.road_fee_amount.toString() || '0');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Use optimistic mutation hook
  const approveMutation = useApprovePermitMutation();

  const handleApprove = async () => {
    const feeAmount = parseFloat(roadFeeAmount);
    if (isNaN(feeAmount) || feeAmount < 0) {
      setError('Please enter a valid road fee amount');
      return;
    }

    setError(null);

    approveMutation.mutate(
      {
        permit_id: request.id,
        decision: 'approved',
        road_fee_amount: feeAmount,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            setShowApproveDialog(false);
            toast({
              title: 'Permit Approved',
              description: `Construction permit for ${request.household.property.address} has been approved.`,
            });
            onApproved?.();
            // Refresh the server data
            router.refresh();
          } else {
            setError(result.error || 'Failed to approve permit');
          }
        },
        onError: (err) => {
          console.error('Error approving permit:', err);
          setError(err instanceof Error ? err.message : 'Unexpected error');
          toast({
            title: 'Error',
            description: 'Failed to approve permit. Please try again.',
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
        permit_id: request.id,
        decision: 'rejected',
        rejection_reason: rejectionReason.trim() || 'Rejected by admin',
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            setShowRejectDialog(false);
            setRejectionReason('');
            toast({
              title: 'Permit Rejected',
              description: `Construction permit for ${request.household.property.address} has been rejected.`,
            });
            onRejected?.();
            // Refresh the server data
            router.refresh();
          } else {
            setError(result.error || 'Failed to reject permit');
          }
        },
        onError: (err) => {
          console.error('Error rejecting permit:', err);
          setError(err instanceof Error ? err.message : 'Unexpected error');
          toast({
            title: 'Error',
            description: 'Failed to reject permit. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const calculateSuggestedFee = () => {
    // Simple fee calculation based on project duration and workers
    // Base fee: $100
    // Duration fee: $10 per day
    // Worker fee: $20 per worker
    const baseFee = 100;
    const durationFee = request.duration_days * 10;
    const workerFee = request.num_workers * 20;
    return baseFee + durationFee + workerFee;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Construction className="h-5 w-5" />
                {request.project_type.charAt(0).toUpperCase() + request.project_type.slice(1)} Project
              </CardTitle>
              <CardDescription>
                Requested on {new Date(request.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant={request.permit_status === 'pending_approval' ? 'secondary' : 'default'}>
              {request.permit_status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Project Information</h4>
            <p className="text-sm text-muted-foreground">{request.description}</p>
            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  <span className="text-muted-foreground">Start:</span>{' '}
                  <span className="font-medium">
                    {new Date(request.start_date).toLocaleDateString()}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  <span className="text-muted-foreground">Duration:</span>{' '}
                  <span className="font-medium">{request.duration_days} days</span>
                </span>
              </div>
            </div>
          </div>

          {/* Contractor Details */}
          {request.contractor_name && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Contractor Information</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{request.contractor_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Workers:</span>
                  <span className="font-medium">{request.num_workers}</span>
                </div>
                {request.materials_description && (
                  <div className="mt-2">
                    <span className="text-muted-foreground">Materials:</span>
                    <p className="text-sm mt-1">{request.materials_description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

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
          {request.contractor_license_url && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </h4>
              <a
                href={request.contractor_license_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                View Contractor License →
              </a>
            </div>
          )}

          {/* Road Fee */}
          {request.road_fee_amount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Road Fee</p>
                <p className="text-lg font-bold">${request.road_fee_amount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  Payment Status: {request.payment_status}
                </p>
              </div>
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
            <DialogTitle>Approve Construction Permit</DialogTitle>
            <DialogDescription>
              Set the road fee amount to approve this permit request for{' '}
              <strong>{request.household.property.address}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="road_fee">Road Fee Amount ($) *</Label>
              <div className="flex gap-2">
                <Input
                  id="road_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={roadFeeAmount}
                  onChange={(e) => setRoadFeeAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={approveMutation.isPending}
                  autoFocus
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRoadFeeAmount(calculateSuggestedFee().toString())}
                  disabled={approveMutation.isPending}
                  className="shrink-0"
                >
                  Suggest Fee
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Suggested fee: ${calculateSuggestedFee().toFixed(2)} (based on {request.duration_days} days, {request.num_workers} workers)
              </p>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                The household will be notified of the approval and required road fee. They must
                pay the fee before work can begin.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setError(null);
              }}
              disabled={approveMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {approveMutation.isPending ? 'Approving...' : 'Approve Permit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Construction Permit</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this permit request for{' '}
              <strong>{request.household.property.address}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="rejection_reason">Reason for Rejection *</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Incomplete documents, project violates community rules, contractor not licensed"
                disabled={approveMutation.isPending}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                The household will be notified with this reason
              </p>
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
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={approveMutation.isPending || !rejectionReason.trim()}
            >
              {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {approveMutation.isPending ? 'Rejecting...' : 'Reject Permit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
