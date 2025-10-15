-- Migration: Add rejection support to vehicle_stickers
-- Description:
--   1. Add 'rejected' status to vehicle_stickers
--   2. Add rejection_reason field
-- Issue: vehicle_stickers table is missing rejection support

-- Add 'rejected' to status enum
ALTER TABLE vehicle_stickers
  DROP CONSTRAINT IF EXISTS vehicle_stickers_status_check;

ALTER TABLE vehicle_stickers
  ADD CONSTRAINT vehicle_stickers_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'ready_for_pickup', 'issued', 'expired', 'lost', 'deactivated'));

-- Add rejection_reason field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicle_stickers' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE vehicle_stickers ADD COLUMN rejection_reason TEXT;
    COMMENT ON COLUMN vehicle_stickers.rejection_reason IS 'Reason why the sticker request was rejected by admin';
  END IF;
END $$;

COMMENT ON CONSTRAINT vehicle_stickers_status_check ON vehicle_stickers IS
  'Vehicle sticker status including rejected state';
