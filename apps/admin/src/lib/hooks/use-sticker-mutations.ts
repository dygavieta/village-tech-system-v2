/**
 * T176: Optimistic Updates for Sticker Approvals
 * Custom hooks for sticker mutations with optimistic UI updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approveStickerRequest } from '@/lib/actions/approve-sticker';

interface ApproveStickerInput {
  sticker_id: string;
  decision: 'approved' | 'rejected';
  rfid_serial?: string;
  rejection_reason?: string;
}

interface StickerData {
  id: string;
  status: string;
  rfid_serial?: string;
  vehicle_plate: string;
  household_id: string;
  [key: string]: any;
}

/**
 * Hook for approving/rejecting stickers with optimistic updates
 */
export function useApproveStickerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveStickerRequest,

    // Optimistic update
    onMutate: async (variables: ApproveStickerInput) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['stickers', 'pending'] });

      // Snapshot the previous value
      const previousStickers = queryClient.getQueryData<StickerData[]>(['stickers', 'pending']);

      // Optimistically update to the new value
      queryClient.setQueryData<StickerData[]>(['stickers', 'pending'], (old) => {
        if (!old) return old;

        // Remove the sticker from pending list
        return old.filter((sticker) => sticker.id !== variables.sticker_id);
      });

      // Also update individual sticker query if it exists
      const previousSticker = queryClient.getQueryData<StickerData>([
        'sticker',
        variables.sticker_id,
      ]);

      if (previousSticker) {
        queryClient.setQueryData<StickerData>(['sticker', variables.sticker_id], {
          ...previousSticker,
          status: variables.decision,
          rfid_serial: variables.rfid_serial,
        });
      }

      // Return context with previous values for rollback
      return { previousStickers, previousSticker };
    },

    // On error, rollback to previous value
    onError: (err, variables, context) => {
      if (context?.previousStickers) {
        queryClient.setQueryData(['stickers', 'pending'], context.previousStickers);
      }
      if (context?.previousSticker) {
        queryClient.setQueryData(['sticker', variables.sticker_id], context.previousSticker);
      }
    },

    // Always refetch after error or success
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stickers', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['sticker', variables.sticker_id] });
      queryClient.invalidateQueries({ queryKey: ['households', variables.sticker_id] });
    },
  });
}
