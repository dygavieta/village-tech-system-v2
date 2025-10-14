-- Migration: Create incidents table
-- Feature: 001-residential-community-management
-- Phase: 7 - User Story 5 (Security & Incident Management)
-- Task: T142

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
  evidence_photo_urls TEXT[] DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'responding', 'resolved')),
  resolved_by_admin_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT DEFAULT NULL,
  resolved_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_incidents_tenant_id ON incidents(tenant_id);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX idx_incidents_incident_type ON incidents(incident_type);
CREATE INDEX idx_incidents_location_gate_id ON incidents(location_gate_id);
CREATE INDEX idx_incidents_location_property_id ON incidents(location_property_id);

-- Enable Row-Level Security
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Security officers can create incident reports
CREATE POLICY incidents_security_create ON incidents
  FOR INSERT
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('security_head', 'security_officer')
    AND reported_by_security_id = auth.uid()
  );

-- RLS Policy: Security officers can view all incidents in their tenant
CREATE POLICY incidents_security_read ON incidents
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('security_head', 'security_officer')
  );

-- RLS Policy: Admins can view and manage all incidents
CREATE POLICY incidents_admin_all ON incidents
  FOR ALL
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('admin_head', 'admin_officer')
  );

-- RLS Policy: Household heads can view incidents at their property
CREATE POLICY incidents_household_read ON incidents
  FOR SELECT
  USING (
    location_property_id IN (
      SELECT property_id FROM households WHERE household_head_id = auth.uid()
    )
  );

-- RLS Policy: Household members can view incidents at their property
CREATE POLICY incidents_household_member_read ON incidents
  FOR SELECT
  USING (
    location_property_id IN (
      SELECT h.property_id FROM households h
      JOIN household_members hm ON h.id = hm.household_id
      WHERE hm.user_id = auth.uid()
    )
  );

-- Function to send notifications for critical incidents
CREATE OR REPLACE FUNCTION notify_critical_incident()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be expanded to send notifications via Edge Functions
  -- For now, it's a placeholder that can be extended
  IF NEW.severity = 'critical' THEN
    RAISE NOTICE 'Critical incident reported: % at tenant %', NEW.id, NEW.tenant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify admins of critical incidents
CREATE TRIGGER notify_critical_incident_trigger
  AFTER INSERT ON incidents
  FOR EACH ROW
  WHEN (NEW.severity = 'critical')
  EXECUTE FUNCTION notify_critical_incident();

-- Comments
COMMENT ON TABLE incidents IS 'Security incident reports with location, severity, and resolution tracking';
COMMENT ON COLUMN incidents.incident_type IS 'Type of incident: suspicious_person, theft, vandalism, noise_complaint, medical_emergency, fire, other';
COMMENT ON COLUMN incidents.location_gate_id IS 'Gate location if incident occurred at a gate';
COMMENT ON COLUMN incidents.location_property_id IS 'Property location if incident occurred at a specific residence';
COMMENT ON COLUMN incidents.severity IS 'Incident severity: low, medium, high, critical';
COMMENT ON COLUMN incidents.evidence_photo_urls IS 'Array of Supabase Storage URLs for evidence photos/videos';
COMMENT ON COLUMN incidents.status IS 'Incident status: reported, responding, resolved';
COMMENT ON COLUMN incidents.resolved_by_admin_id IS 'Admin user who resolved the incident';
COMMENT ON COLUMN incidents.resolution_notes IS 'Details of how the incident was resolved';
COMMENT ON FUNCTION notify_critical_incident() IS 'Sends notifications for critical incidents to admins';
