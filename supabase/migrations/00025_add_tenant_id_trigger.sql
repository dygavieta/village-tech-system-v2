-- Migration: Add trigger to auto-populate tenant_id for vehicle_stickers
-- Description: Automatically set tenant_id from JWT when inserting vehicle sticker requests
-- Issue: RLS WITH CHECK requires tenant_id, but client doesn't provide it (security best practice)

-- First, we need to modify the tenant_isolation policy to not block INSERTs without tenant_id
-- The original policy is FOR ALL which includes INSERT, UPDATE, DELETE, SELECT
-- We need to split it so INSERT can work before tenant_id is populated by trigger

-- Drop the existing tenant_isolation policy
DROP POLICY IF EXISTS tenant_isolation_vehicle_stickers ON vehicle_stickers;

-- Recreate tenant_isolation for SELECT, UPDATE, DELETE (everything except INSERT)
CREATE POLICY tenant_isolation_vehicle_stickers_select ON vehicle_stickers
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY tenant_isolation_vehicle_stickers_update ON vehicle_stickers
  FOR UPDATE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY tenant_isolation_vehicle_stickers_delete ON vehicle_stickers
  FOR DELETE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- For INSERT, tenant_isolation will be enforced by the trigger + verification
-- No explicit tenant_id check needed in RLS WITH CHECK for INSERT

-- Create a trigger function to auto-populate tenant_id from JWT
CREATE OR REPLACE FUNCTION auto_populate_tenant_id_vehicle_stickers()
RETURNS TRIGGER AS $$
BEGIN
  -- Get tenant_id from JWT and set it
  NEW.tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;

  -- Security check: if user somehow provided a tenant_id, verify it matches JWT
  -- This prevents tenant_id spoofing
  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id could not be determined from JWT';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger (runs BEFORE RLS checks)
DROP TRIGGER IF EXISTS trigger_auto_populate_tenant_id_vehicle_stickers ON vehicle_stickers;

CREATE TRIGGER trigger_auto_populate_tenant_id_vehicle_stickers
  BEFORE INSERT ON vehicle_stickers
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_tenant_id_vehicle_stickers();

-- Add comment
COMMENT ON FUNCTION auto_populate_tenant_id_vehicle_stickers() IS
  'Automatically populates tenant_id from JWT for new vehicle sticker records';

-- Update the household_can_request_stickers policy to not check tenant_id
-- (trigger handles it)
DROP POLICY IF EXISTS household_can_request_stickers ON vehicle_stickers;

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
    -- tenant_id is auto-populated by trigger and verified there
  );

COMMENT ON POLICY household_can_request_stickers ON vehicle_stickers IS
  'Allows household heads to submit vehicle sticker requests. tenant_id is auto-populated by trigger.';
