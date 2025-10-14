-- Migration: Create announcements table
-- Feature: 001-residential-community-management
-- Phase: 7 - User Story 5 (Admin Communication)
-- Task: T138

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by_admin_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('critical', 'important', 'info')),
  category TEXT NOT NULL CHECK (category IN ('event', 'maintenance', 'security', 'policy', 'general')),
  target_audience TEXT NOT NULL CHECK (target_audience IN ('all_residents', 'all_security', 'specific_households', 'all')),
  specific_household_ids UUID[] DEFAULT NULL,
  effective_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_end TIMESTAMPTZ DEFAULT NULL,
  requires_acknowledgment BOOLEAN DEFAULT FALSE,
  attachment_urls TEXT[] DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_announcements_tenant_id ON announcements(tenant_id);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX idx_announcements_urgency ON announcements(urgency);
CREATE INDEX idx_announcements_target_audience ON announcements(target_audience);
CREATE INDEX idx_announcements_effective_dates ON announcements(effective_start, effective_end);

-- Enable Row-Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can create and manage announcements
CREATE POLICY announcements_admin_all ON announcements
  FOR ALL
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('admin_head', 'admin_officer')
  );

-- RLS Policy: Residents can view announcements targeted to them
CREATE POLICY announcements_residents_read ON announcements
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
      target_audience = 'all'
      OR target_audience = 'all_residents'
      OR (
        target_audience = 'specific_households'
        AND auth.uid() IN (
          SELECT household_head_id FROM households WHERE id = ANY(specific_household_ids)
        )
      )
    )
    AND (effective_end IS NULL OR effective_end > NOW())
  );

-- RLS Policy: Security officers can view announcements targeted to them
CREATE POLICY announcements_security_read ON announcements
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
      target_audience = 'all'
      OR target_audience = 'all_security'
    )
    AND (effective_end IS NULL OR effective_end > NOW())
    AND (auth.jwt() ->> 'role') IN ('security_head', 'security_officer')
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE announcements IS 'Community announcements from admin to residents/security';
COMMENT ON COLUMN announcements.urgency IS 'critical = red alert, important = yellow warning, info = blue notice';
COMMENT ON COLUMN announcements.target_audience IS 'Who should see this announcement';
COMMENT ON COLUMN announcements.specific_household_ids IS 'Array of household IDs if target_audience = specific_households';
