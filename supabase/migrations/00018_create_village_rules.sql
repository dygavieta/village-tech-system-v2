-- Migration: Create village_rules table
-- Feature: 001-residential-community-management
-- Phase: 7 - User Story 5 (Admin Communication)
-- Task: T140

-- Create village_rules table
CREATE TABLE IF NOT EXISTS village_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by_admin_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  category TEXT NOT NULL CHECK (category IN ('noise', 'parking', 'pets', 'construction', 'visitors', 'curfew', 'general')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  effective_date DATE NOT NULL,
  published_at TIMESTAMPTZ DEFAULT NULL,
  requires_acknowledgment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_village_rules_tenant_id ON village_rules(tenant_id);
CREATE INDEX idx_village_rules_category ON village_rules(category);
CREATE INDEX idx_village_rules_effective_date ON village_rules(effective_date);
CREATE INDEX idx_village_rules_published_at ON village_rules(published_at);

-- Enable Row-Level Security
ALTER TABLE village_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can create and manage village rules
CREATE POLICY village_rules_admin_all ON village_rules
  FOR ALL
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('admin_head', 'admin_officer')
  );

-- RLS Policy: Residents can view published rules
CREATE POLICY village_rules_residents_read ON village_rules
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND published_at IS NOT NULL
    AND effective_date <= CURRENT_DATE
    AND (auth.jwt() ->> 'role') IN ('household_head', 'household_member')
  );

-- RLS Policy: Security officers can view published rules
CREATE POLICY village_rules_security_read ON village_rules
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND published_at IS NOT NULL
    AND effective_date <= CURRENT_DATE
    AND (auth.jwt() ->> 'role') IN ('security_head', 'security_officer')
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_village_rules_updated_at
  BEFORE UPDATE ON village_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE village_rules IS 'Community rules and policies with version control and effective dates';
COMMENT ON COLUMN village_rules.category IS 'Rule category: noise, parking, pets, construction, visitors, curfew, general';
COMMENT ON COLUMN village_rules.version IS 'Version number for tracking rule updates';
COMMENT ON COLUMN village_rules.effective_date IS 'Date when the rule becomes effective';
COMMENT ON COLUMN village_rules.published_at IS 'Timestamp when the rule was published (NULL = draft)';
COMMENT ON COLUMN village_rules.requires_acknowledgment IS 'Whether residents must acknowledge this rule';
