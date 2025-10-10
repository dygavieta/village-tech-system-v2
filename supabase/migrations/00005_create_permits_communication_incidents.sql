-- Migration: Create construction permits, announcements, incidents, and fees
-- Description: Permits, Communication, Security & Incidents, Financials domains

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

CREATE INDEX idx_construction_permits_tenant_id ON construction_permits(tenant_id);
CREATE INDEX idx_construction_permits_household_id ON construction_permits(household_id);
CREATE INDEX idx_construction_permits_permit_status ON construction_permits(permit_status);
CREATE INDEX idx_construction_permits_start_date ON construction_permits(start_date);

ALTER TABLE construction_permits ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_construction_permits ON construction_permits
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY household_access_construction_permits ON construction_permits
  FOR SELECT USING (
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
  );

CREATE POLICY admin_access_construction_permits ON construction_permits
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin_head', 'admin_officer')
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

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

CREATE INDEX idx_construction_workers_tenant_id ON construction_workers(tenant_id);
CREATE INDEX idx_construction_workers_permit_id ON construction_workers(permit_id);

ALTER TABLE construction_workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_construction_workers ON construction_workers
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by_admin_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('critical', 'important', 'info')),
  category TEXT NOT NULL CHECK (category IN ('event', 'maintenance', 'security', 'policy')),
  target_audience TEXT NOT NULL CHECK (target_audience IN ('all_residents', 'all_security', 'specific_households', 'all')),
  specific_household_ids UUID[],
  effective_start TIMESTAMPTZ DEFAULT NOW(),
  effective_end TIMESTAMPTZ,
  requires_acknowledgment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_announcements_tenant_id ON announcements(tenant_id);
CREATE INDEX idx_announcements_created_at ON announcements(created_at);
CREATE INDEX idx_announcements_urgency ON announcements(urgency);
CREATE INDEX idx_announcements_target_audience ON announcements(target_audience);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_announcements ON announcements
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY admin_create_announcements ON announcements
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin_head', 'admin_officer')
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Create announcement_acknowledgments table
CREATE TABLE IF NOT EXISTS announcement_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

CREATE INDEX idx_announcement_acknowledgments_announcement_id ON announcement_acknowledgments(announcement_id);
CREATE INDEX idx_announcement_acknowledgments_user_id ON announcement_acknowledgments(user_id);

ALTER TABLE announcement_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_acknowledge_announcements ON announcement_acknowledgments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reported_by_security_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('suspicious_person', 'theft', 'vandalism', 'noise_complaint', 'medical_emergency', 'fire', 'other')),
  location_gate_id UUID REFERENCES gates(id) ON DELETE SET NULL,
  location_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  evidence_photo_urls TEXT[],
  status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'responding', 'resolved')),
  resolved_by_admin_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_tenant_id ON incidents(tenant_id);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_incidents ON incidents
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY security_create_incidents ON incidents
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' IN ('security_head', 'security_officer')
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Create association_fees table
CREATE TABLE IF NOT EXISTS association_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('monthly', 'annual', 'special_assessment')),
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'overdue')),
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_association_fees_tenant_id ON association_fees(tenant_id);
CREATE INDEX idx_association_fees_household_id ON association_fees(household_id);
CREATE INDEX idx_association_fees_due_date ON association_fees(due_date);
CREATE INDEX idx_association_fees_payment_status ON association_fees(payment_status);

ALTER TABLE association_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_association_fees ON association_fees
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY household_access_association_fees ON association_fees
  FOR SELECT USING (
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
  );

CREATE POLICY admin_access_association_fees ON association_fees
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin_head', 'admin_officer')
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Comments
COMMENT ON TABLE construction_permits IS 'Permits for construction/renovation work';
COMMENT ON TABLE construction_workers IS 'Registered workers for active permits';
COMMENT ON TABLE announcements IS 'Announcements from admin to residents/security';
COMMENT ON TABLE announcement_acknowledgments IS 'Tracks who has read/acknowledged announcements';
COMMENT ON TABLE incidents IS 'Security incident reports';
COMMENT ON TABLE association_fees IS 'HOA fees owed by households';
