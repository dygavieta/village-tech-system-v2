-- Migration: Fix household_members RLS to allow residents to manage members
-- Description:
--   1. Split tenant_isolation_household_members policy (remove FOR ALL)
--   2. Add BEFORE INSERT trigger to auto-populate tenant_id from JWT
--   3. Add explicit INSERT/UPDATE/DELETE policies for household heads
-- Issue: Household heads cannot add/manage household members due to restrictive RLS

-- Drop the existing FOR ALL tenant isolation policy
DROP POLICY IF EXISTS tenant_isolation_household_members ON household_members;

-- Create separate tenant isolation policies for each operation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'household_members' AND policyname = 'tenant_isolation_household_members_select'
  ) THEN
    CREATE POLICY tenant_isolation_household_members_select ON household_members
      FOR SELECT USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'household_members' AND policyname = 'tenant_isolation_household_members_update'
  ) THEN
    CREATE POLICY tenant_isolation_household_members_update ON household_members
      FOR UPDATE USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'household_members' AND policyname = 'tenant_isolation_household_members_delete'
  ) THEN
    CREATE POLICY tenant_isolation_household_members_delete ON household_members
      FOR DELETE USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      );
  END IF;
END $$;

-- Create trigger function to auto-populate tenant_id from JWT
CREATE OR REPLACE FUNCTION auto_populate_tenant_id_household_members()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract tenant_id from JWT claims
  NEW.tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;

  -- Ensure tenant_id was successfully extracted
  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id could not be determined from JWT';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_populate_tenant_id_household_members_trigger ON household_members;

-- Create BEFORE INSERT trigger
CREATE TRIGGER auto_populate_tenant_id_household_members_trigger
  BEFORE INSERT ON household_members
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_tenant_id_household_members();

-- Add INSERT policy for household heads
-- Household heads can insert members for their own household
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'household_members' AND policyname = 'household_heads_insert_members'
  ) THEN
    CREATE POLICY household_heads_insert_members ON household_members
      FOR INSERT WITH CHECK (
        household_id IN (
          SELECT id FROM households WHERE household_head_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Add UPDATE policy for household heads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'household_members' AND policyname = 'household_heads_update_members'
  ) THEN
    CREATE POLICY household_heads_update_members ON household_members
      FOR UPDATE USING (
        household_id IN (
          SELECT id FROM households WHERE household_head_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Add DELETE policy for household heads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'household_members' AND policyname = 'household_heads_delete_members'
  ) THEN
    CREATE POLICY household_heads_delete_members ON household_members
      FOR DELETE USING (
        household_id IN (
          SELECT id FROM households WHERE household_head_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Add SELECT policy for household heads (to view their own household members)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'household_members' AND policyname = 'household_heads_select_members'
  ) THEN
    CREATE POLICY household_heads_select_members ON household_members
      FOR SELECT USING (
        household_id IN (
          SELECT id FROM households WHERE household_head_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Comments
COMMENT ON FUNCTION auto_populate_tenant_id_household_members IS 'Auto-populate tenant_id from JWT before inserting household member records';
COMMENT ON TRIGGER auto_populate_tenant_id_household_members_trigger ON household_members IS 'Ensures tenant_id is populated from JWT for all household member inserts';
