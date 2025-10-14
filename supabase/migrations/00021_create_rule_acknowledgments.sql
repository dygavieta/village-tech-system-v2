-- Migration: Create rule_acknowledgments table
-- Feature: 001-residential-community-management
-- Phase: 7 - User Story 5 (Admin Communication)
-- Task: T151d

-- Create rule_acknowledgments table
CREATE TABLE IF NOT EXISTS rule_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES village_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure a user can only acknowledge a rule once
  UNIQUE(rule_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_rule_acknowledgments_rule_id ON rule_acknowledgments(rule_id);
CREATE INDEX idx_rule_acknowledgments_user_id ON rule_acknowledgments(user_id);
CREATE INDEX idx_rule_acknowledgments_acknowledged_at ON rule_acknowledgments(acknowledged_at DESC);

-- Enable Row-Level Security
ALTER TABLE rule_acknowledgments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can create their own acknowledgments
CREATE POLICY rule_acknowledgments_user_create ON rule_acknowledgments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- RLS Policy: Users can view their own acknowledgments
CREATE POLICY rule_acknowledgments_user_read ON rule_acknowledgments
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- RLS Policy: Admins can view all acknowledgments in their tenant
CREATE POLICY rule_acknowledgments_admin_read ON rule_acknowledgments
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role') IN ('admin_head', 'admin_officer')
    AND rule_id IN (
      SELECT id FROM village_rules WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- Comments
COMMENT ON TABLE rule_acknowledgments IS 'Tracks which users have acknowledged village rules';
COMMENT ON COLUMN rule_acknowledgments.rule_id IS 'Reference to the village rule being acknowledged';
COMMENT ON COLUMN rule_acknowledgments.user_id IS 'User who acknowledged the rule';
COMMENT ON COLUMN rule_acknowledgments.acknowledged_at IS 'Timestamp when the rule was acknowledged';
