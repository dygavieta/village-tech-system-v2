/**
 * T176: Optimistic Updates for Permit Approvals
 * Custom hooks for permit mutations with optimistic UI updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approvePermitRequest } from '@/lib/actions/approve-permit';

interface ApprovePermitInput {
  permit_id: string;
  decision: 'approved' | 'rejected';
  road_fee_amount?: number;
  rejection_reason?: string;
}

interface PermitData {
  id: string;
  permit_status: string;
  road_fee_amount?: number;
  project_type: string;
  household_id: string;
  [key: string]: any;
}

/**
 * Hook for approving/rejecting permits with optimistic updates
 */
export function useApprovePermitMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approvePermitRequest,

    // Optimistic update
    onMutate: async (variables: ApprovePermitInput) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['permits', 'pending'] });

      // Snapshot the previous value
      const previousPermits = queryClient.getQueryData<PermitData[]>(['permits', 'pending']);

      // Optimistically update to the new value
      queryClient.setQueryData<PermitData[]>(['permits', 'pending'], (old) => {
        if (!old) return old;

        // Remove the permit from pending list
        return old.filter((permit) => permit.id !== variables.permit_id);
      });

      // Also update individual permit query if it exists
      const previousPermit = queryClient.getQueryData<PermitData>([
        'permit',
        variables.permit_id,
      ]);

      if (previousPermit) {
        queryClient.setQueryData<PermitData>(['permit', variables.permit_id], {
          ...previousPermit,
          permit_status: variables.decision,
          road_fee_amount: variables.road_fee_amount ?? previousPermit.road_fee_amount,
        });
      }

      // Return context with previous values for rollback
      return { previousPermits, previousPermit };
    },

    // On error, rollback to previous value
    onError: (err, variables, context) => {
      if (context?.previousPermits) {
        queryClient.setQueryData(['permits', 'pending'], context.previousPermits);
      }
      if (context?.previousPermit) {
        queryClient.setQueryData(['permit', variables.permit_id], context.previousPermit);
      }
    },

    // Always refetch after error or success
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permits', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['permit', variables.permit_id] });
      queryClient.invalidateQueries({ queryKey: ['households', variables.permit_id] });
    },
  });
}
