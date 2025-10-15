-- Migration: Fix vehicle_stickers RLS policies and schema
-- Description:
--   1. Add INSERT policy for household heads to submit vehicle sticker requests
--   2. Make rfid_serial nullable (admins assign it during approval)
--   3. Add approved_at timestamp field for tracking approval time
-- Issue: Residents were getting "RLS policy violation" when trying to submit sticker requests

-- ============================================
-- SCHEMA FIXES
-- ============================================

-- Make rfid_serial nullable (it's assigned by admins during approval, not by residents during request)
ALTER TABLE vehicle_stickers
  ALTER COLUMN rfid_serial DROP NOT NULL;

-- Make rfid_serial non-unique temporarily to allow NULL values, then re-add unique constraint for non-null values
ALTER TABLE vehicle_stickers
  DROP CONSTRAINT IF EXISTS vehicle_stickers_rfid_serial_key;

-- Add unique constraint that only applies to non-null rfid_serial values
-- This allows multiple NULL values but ensures unique RFID serials when assigned
CREATE UNIQUE INDEX IF NOT EXISTS vehicle_stickers_rfid_serial_unique
  ON vehicle_stickers(rfid_serial)
  WHERE rfid_serial IS NOT NULL;

-- Add approved_at timestamp field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicle_stickers' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE vehicle_stickers ADD COLUMN approved_at TIMESTAMPTZ;
    COMMENT ON COLUMN vehicle_stickers.approved_at IS 'Timestamp when the sticker request was approved by admin';
  END IF;
END $$;

-- ============================================
-- RLS POLICY FIXES
-- ============================================

-- Drop the existing household_access policy (which is SELECT only)
DROP POLICY IF EXISTS household_access_vehicle_stickers ON vehicle_stickers;

-- Recreate household_access policy to allow residents to SELECT their own stickers
CREATE POLICY household_access_vehicle_stickers_select ON vehicle_stickers
  FOR SELECT USING (
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
  );

-- Add new INSERT policy for household heads to create sticker requests
CREATE POLICY household_can_request_stickers ON vehicle_stickers
  FOR INSERT
  WITH CHECK (
    -- User must be authenticated
    auth.uid() IS NOT NULL
    AND
    -- The household_id must belong to the user (they are the household head)
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
    AND
    -- Tenant ID must match the user's tenant
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Add UPDATE policy for household heads to update their own pending stickers
-- (e.g., if they need to correct information before admin approval)
CREATE POLICY household_can_update_pending_stickers ON vehicle_stickers
  FOR UPDATE
  USING (
    -- Can only update if household belongs to user
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
    AND
    -- Can only update pending stickers (not approved ones)
    status = 'pending'
  )
  WITH CHECK (
    -- Same conditions as USING
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
    AND
    status = 'pending'
  );

-- Add DELETE policy for household heads to cancel their own pending sticker requests
CREATE POLICY household_can_cancel_pending_stickers ON vehicle_stickers
  FOR DELETE
  USING (
    -- Can only delete if household belongs to user
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
    AND
    -- Can only delete pending stickers (not approved/issued ones)
    status = 'pending'
  );

-- Add comment explaining the policies
COMMENT ON POLICY household_can_request_stickers ON vehicle_stickers IS
  'Allows household heads to submit vehicle sticker requests for their household';

COMMENT ON POLICY household_can_update_pending_stickers ON vehicle_stickers IS
  'Allows household heads to update their pending sticker requests before admin approval';

COMMENT ON POLICY household_can_cancel_pending_stickers ON vehicle_stickers IS
  'Allows household heads to cancel their pending sticker requests';
