-- Migration: Create announcement_acknowledgments table
-- Feature: 001-residential-community-management
-- Phase: 7 - User Story 5 (Admin Communication)
-- Task: T139

-- Create announcement_acknowledgments table
CREATE TABLE IF NOT EXISTS announcement_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure a user can only acknowledge an announcement once
  UNIQUE(announcement_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_announcement_acknowledgments_announcement_id ON announcement_acknowledgments(announcement_id);
CREATE INDEX idx_announcement_acknowledgments_user_id ON announcement_acknowledgments(user_id);
CREATE INDEX idx_announcement_acknowledgments_acknowledged_at ON announcement_acknowledgments(acknowledged_at DESC);

-- Enable Row-Level Security
ALTER TABLE announcement_acknowledgments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can create their own acknowledgments
CREATE POLICY announcement_acknowledgments_user_create ON announcement_acknowledgments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- RLS Policy: Users can view their own acknowledgments
CREATE POLICY announcement_acknowledgments_user_read ON announcement_acknowledgments
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- RLS Policy: Admins can view all acknowledgments in their tenant
CREATE POLICY announcement_acknowledgments_admin_read ON announcement_acknowledgments
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role') IN ('admin_head', 'admin_officer')
    AND announcement_id IN (
      SELECT id FROM announcements WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- Comments
COMMENT ON TABLE announcement_acknowledgments IS 'Tracks which users have read/acknowledged announcements';
COMMENT ON COLUMN announcement_acknowledgments.announcement_id IS 'Reference to the announcement being acknowledged';
COMMENT ON COLUMN announcement_acknowledgments.user_id IS 'User who acknowledged the announcement';
COMMENT ON COLUMN announcement_acknowledgments.acknowledged_at IS 'Timestamp when the announcement was acknowledged';
