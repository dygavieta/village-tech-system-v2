-- Migration: Add rejection_reason to construction_permits
-- Description: Add rejection_reason field to track why permits were rejected
-- Issue: construction_permits table is missing rejection_reason field

-- Add rejection_reason field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'construction_permits' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE construction_permits ADD COLUMN rejection_reason TEXT;
    COMMENT ON COLUMN construction_permits.rejection_reason IS 'Reason why the permit request was rejected by admin';
  END IF;
END $$;
