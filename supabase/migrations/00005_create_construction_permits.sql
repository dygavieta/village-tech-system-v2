-- Migration: 00005_create_construction_permits
-- Description: Create construction permits and workers tables for project management
-- Note: Other Phase 7 tables moved to dedicated migrations:
--       - announcements -> 00016_create_announcements.sql
--       - announcement_acknowledgments -> 00017_create_announcement_acknowledgments.sql
--       - association_fees -> 00019_create_association_fees.sql
--       - incidents -> 00020_create_incidents.sql
-- Feature: 001-residential-community-management
-- Phase: 5 - User Story 3 (Construction Permits)

-- Create construction_permits table
CREATE TABLE IF NOT EXISTS construction_permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  project_type TEXT NOT NULL CHECK (project_type IN ('renovation', 'addition', 'repair', 'landscaping')),
  description TEXT NOT NULL,
  start_date DATE NOT NULL,
  duration_days INTEGER NOT NULL,
  contractor_name TEXT,
  contractor_license_url TEXT,
  num_workers INTEGER DEFAULT 1,
  materials_description TEXT,
  road_fee_amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  permit_status TEXT DEFAULT 'pending_approval' CHECK (permit_status IN ('pending_approval', 'approved', 'active', 'on_hold', 'completed', 'rejected')),
  approved_by_admin_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_construction_permits_tenant_id ON construction_permits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_construction_permits_household_id ON construction_permits(household_id);
CREATE INDEX IF NOT EXISTS idx_construction_permits_permit_status ON construction_permits(permit_status);
CREATE INDEX IF NOT EXISTS idx_construction_permits_start_date ON construction_permits(start_date);

ALTER TABLE construction_permits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'construction_permits' AND policyname = 'tenant_isolation_construction_permits'
  ) THEN
    CREATE POLICY tenant_isolation_construction_permits ON construction_permits
      FOR ALL USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'construction_permits' AND policyname = 'household_access_construction_permits'
  ) THEN
    CREATE POLICY household_access_construction_permits ON construction_permits
      FOR SELECT USING (
        household_id IN (
          SELECT id FROM households WHERE household_head_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'construction_permits' AND policyname = 'admin_access_construction_permits'
  ) THEN
    CREATE POLICY admin_access_construction_permits ON construction_permits
      FOR ALL USING (
        auth.jwt() ->> 'user_role' IN ('admin_head', 'admin_officer')
        AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      );
  END IF;
END $$;

-- Create construction_workers table
CREATE TABLE IF NOT EXISTS construction_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  permit_id UUID NOT NULL REFERENCES construction_permits(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  government_id_number TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_construction_workers_tenant_id ON construction_workers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_construction_workers_permit_id ON construction_workers(permit_id);

ALTER TABLE construction_workers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'construction_workers' AND policyname = 'tenant_isolation_construction_workers'
  ) THEN
    CREATE POLICY tenant_isolation_construction_workers ON construction_workers
      FOR ALL USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      );
  END IF;
END $$;

-- Comments
COMMENT ON TABLE construction_permits IS 'Permits for construction/renovation work';
COMMENT ON TABLE construction_workers IS 'Registered workers for active permits';
