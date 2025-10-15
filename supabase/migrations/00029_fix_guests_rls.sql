-- Migration: Fix guests RLS to auto-populate tenant_id
-- Description:
--   1. Split tenant_isolation_guests policy (remove FOR ALL)
--   2. Add BEFORE INSERT trigger to auto-populate tenant_id from JWT
--   3. Add explicit INSERT policies for residents
-- Issue: Residents cannot create guests due to missing tenant_id

-- Drop the existing FOR ALL tenant isolation policy
DROP POLICY IF EXISTS tenant_isolation_guests ON guests;

-- Create separate tenant isolation policies for each operation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guests' AND policyname = 'tenant_isolation_guests_select'
  ) THEN
    CREATE POLICY tenant_isolation_guests_select ON guests
      FOR SELECT USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guests' AND policyname = 'tenant_isolation_guests_update'
  ) THEN
    CREATE POLICY tenant_isolation_guests_update ON guests
      FOR UPDATE USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guests' AND policyname = 'tenant_isolation_guests_delete'
  ) THEN
    CREATE POLICY tenant_isolation_guests_delete ON guests
      FOR DELETE USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      );
  END IF;
END $$;

-- Create trigger function to auto-populate tenant_id from JWT
CREATE OR REPLACE FUNCTION auto_populate_tenant_id_guests()
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
DROP TRIGGER IF EXISTS auto_populate_tenant_id_guests_trigger ON guests;

-- Create BEFORE INSERT trigger
CREATE TRIGGER auto_populate_tenant_id_guests_trigger
  BEFORE INSERT ON guests
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_tenant_id_guests();

-- Add INSERT policy for residents (household heads)
-- Residents can insert guests for their own household
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guests' AND policyname = 'residents_insert_guests'
  ) THEN
    CREATE POLICY residents_insert_guests ON guests
      FOR INSERT WITH CHECK (
        household_id IN (
          SELECT id FROM households WHERE household_head_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Add INSERT policy for security officers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guests' AND policyname = 'security_insert_guests'
  ) THEN
    CREATE POLICY security_insert_guests ON guests
      FOR INSERT WITH CHECK (
        auth.jwt() ->> 'user_role' IN ('security_head', 'security_officer')
      );
  END IF;
END $$;

-- Comments
COMMENT ON FUNCTION auto_populate_tenant_id_guests IS 'Auto-populate tenant_id from JWT before inserting guest records';
COMMENT ON TRIGGER auto_populate_tenant_id_guests_trigger ON guests IS 'Ensures tenant_id is populated from JWT for all guest inserts';
