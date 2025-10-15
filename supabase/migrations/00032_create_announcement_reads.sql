-- Migration: Create announcement_reads table
-- Feature: 001-residential-community-management
-- Phase: 7 - User Story 5 (Admin Communication)
-- Purpose: Track when users read/view announcements (separate from acknowledgments)

-- Create announcement_reads table
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure a user can only mark an announcement as read once
  UNIQUE(announcement_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_announcement_reads_announcement_id ON announcement_reads(announcement_id);
CREATE INDEX idx_announcement_reads_user_id ON announcement_reads(user_id);
CREATE INDEX idx_announcement_reads_read_at ON announcement_reads(read_at DESC);

-- Enable Row-Level Security
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can create their own read records
CREATE POLICY announcement_reads_user_create ON announcement_reads
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- RLS Policy: Users can view their own read records
CREATE POLICY announcement_reads_user_read ON announcement_reads
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- RLS Policy: Users can update their own read records (for upsert operations)
CREATE POLICY announcement_reads_user_update ON announcement_reads
  FOR UPDATE
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- RLS Policy: Admins can view all read records in their tenant
CREATE POLICY announcement_reads_admin_read ON announcement_reads
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role') IN ('admin_head', 'admin_officer')
    AND announcement_id IN (
      SELECT id FROM announcements WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- Comments
COMMENT ON TABLE announcement_reads IS 'Tracks when users view/read announcements (not formal acknowledgment)';
COMMENT ON COLUMN announcement_reads.announcement_id IS 'Reference to the announcement being read';
COMMENT ON COLUMN announcement_reads.user_id IS 'User who read the announcement';
COMMENT ON COLUMN announcement_reads.read_at IS 'Timestamp when the announcement was first read';
