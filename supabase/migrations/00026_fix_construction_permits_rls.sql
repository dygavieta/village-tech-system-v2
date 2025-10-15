-- Migration: Fix construction_permits RLS policies
-- Description:
--   1. Add INSERT policy for household heads to submit construction permit requests
--   2. Split tenant_isolation policy to allow INSERT without tenant_id
--   3. Create trigger to auto-populate tenant_id from JWT
--   4. Add UPDATE/DELETE policies for residents to manage pending permits
-- Issue: Same as vehicle_stickers - residents getting "RLS policy violation" when submitting permits

-- ============================================
-- STEP 1: Split tenant_isolation Policy
-- ============================================

-- Drop the existing FOR ALL policy
DROP POLICY IF EXISTS tenant_isolation_construction_permits ON construction_permits;

-- Recreate as separate policies for each operation (except INSERT)
CREATE POLICY tenant_isolation_construction_permits_select ON construction_permits
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY tenant_isolation_construction_permits_update ON construction_permits
  FOR UPDATE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY tenant_isolation_construction_permits_delete ON construction_permits
  FOR DELETE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- ============================================
-- STEP 2: Create Trigger to Auto-Populate tenant_id
-- ============================================

CREATE OR REPLACE FUNCTION auto_populate_tenant_id_construction_permits()
RETURNS TRIGGER AS $$
BEGIN
  -- Get tenant_id from JWT and set it
  NEW.tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;

  -- Security check: ensure tenant_id could be determined
  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id could not be determined from JWT';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_populate_tenant_id_construction_permits ON construction_permits;

CREATE TRIGGER trigger_auto_populate_tenant_id_construction_permits
  BEFORE INSERT ON construction_permits
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_tenant_id_construction_permits();

COMMENT ON FUNCTION auto_populate_tenant_id_construction_permits() IS
  'Automatically populates tenant_id from JWT for new construction permit records';

-- ============================================
-- STEP 3: Update Household Access Policies
-- ============================================

-- Drop the existing SELECT-only policy
DROP POLICY IF EXISTS household_access_construction_permits ON construction_permits;

-- Recreate SELECT policy
CREATE POLICY household_access_construction_permits_select ON construction_permits
  FOR SELECT USING (
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
  );

-- Create INSERT policy for household heads to submit permit requests
CREATE POLICY household_can_request_construction_permits ON construction_permits
  FOR INSERT
  WITH CHECK (
    -- User must be authenticated
    auth.uid() IS NOT NULL
    AND
    -- The household_id must belong to the user (they are the household head)
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
    -- tenant_id is auto-populated by trigger
  );

-- Create UPDATE policy for household heads to update pending permits
CREATE POLICY household_can_update_pending_permits ON construction_permits
  FOR UPDATE
  USING (
    -- Can only update if household belongs to user
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
    AND
    -- Can only update pending permits (not approved/active ones)
    permit_status = 'pending_approval'
  )
  WITH CHECK (
    -- Same conditions as USING
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
    AND
    permit_status = 'pending_approval'
  );

-- Create DELETE policy for household heads to cancel pending permits
CREATE POLICY household_can_cancel_pending_permits ON construction_permits
  FOR DELETE
  USING (
    -- Can only delete if household belongs to user
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
    AND
    -- Can only delete pending permits (not approved/active ones)
    permit_status = 'pending_approval'
  );

-- Add comments explaining the policies
COMMENT ON POLICY household_can_request_construction_permits ON construction_permits IS
  'Allows household heads to submit construction permit requests. tenant_id is auto-populated by trigger.';

COMMENT ON POLICY household_can_update_pending_permits ON construction_permits IS
  'Allows household heads to update their pending permit requests before admin approval';

COMMENT ON POLICY household_can_cancel_pending_permits ON construction_permits IS
  'Allows household heads to cancel their pending permit requests';

-- ============================================
-- STEP 4: Fix construction_workers RLS too
-- ============================================

-- Construction workers also need the same fix
-- Drop the existing FOR ALL policy
DROP POLICY IF EXISTS tenant_isolation_construction_workers ON construction_workers;

-- Recreate as separate policies
CREATE POLICY tenant_isolation_construction_workers_select ON construction_workers
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY tenant_isolation_construction_workers_update ON construction_workers
  FOR UPDATE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY tenant_isolation_construction_workers_delete ON construction_workers
  FOR DELETE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Create trigger for construction_workers
CREATE OR REPLACE FUNCTION auto_populate_tenant_id_construction_workers()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;

  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id could not be determined from JWT';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_populate_tenant_id_construction_workers ON construction_workers;

CREATE TRIGGER trigger_auto_populate_tenant_id_construction_workers
  BEFORE INSERT ON construction_workers
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_tenant_id_construction_workers();

-- Allow admins to manage workers (they need INSERT policy)
CREATE POLICY admin_can_manage_construction_workers ON construction_workers
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'user_role' IN ('admin_head', 'admin_officer')
    -- tenant_id auto-populated by trigger
  );
