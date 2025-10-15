-- Migration: Fix announcements RLS to allow admins to create announcements
-- Description:
--   1. Drop the FOR ALL policy that requires tenant_id in JWT
--   2. Create separate INSERT/SELECT/UPDATE/DELETE policies
--   3. Check role from user_profiles table (not JWT) since JWT may not have role claim
-- Issue: Admins cannot create announcements due to restrictive RLS

-- Drop all existing admin policies
DROP POLICY IF EXISTS announcements_admin_all ON announcements;
DROP POLICY IF EXISTS announcements_admin_insert ON announcements;
DROP POLICY IF EXISTS announcements_admin_select ON announcements;
DROP POLICY IF EXISTS announcements_admin_update ON announcements;
DROP POLICY IF EXISTS announcements_admin_delete ON announcements;

-- Create separate policies for admins that check user_profiles table

-- INSERT: Admins can insert announcements
CREATE POLICY announcements_admin_insert ON announcements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin_head', 'admin_officer')
    )
  );

-- SELECT: Admins can view all announcements
CREATE POLICY announcements_admin_select ON announcements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin_head', 'admin_officer')
    )
  );

-- UPDATE: Admins can update announcements
CREATE POLICY announcements_admin_update ON announcements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin_head', 'admin_officer')
    )
  );

-- DELETE: Admins can delete announcements
CREATE POLICY announcements_admin_delete ON announcements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin_head', 'admin_officer')
    )
  );

-- Comments
COMMENT ON POLICY announcements_admin_insert ON announcements IS 'Admins can create announcements (checks user_profiles.role)';
COMMENT ON POLICY announcements_admin_select ON announcements IS 'Admins can view all announcements (checks user_profiles.role)';
COMMENT ON POLICY announcements_admin_update ON announcements IS 'Admins can update announcements (checks user_profiles.role)';
COMMENT ON POLICY announcements_admin_delete ON announcements IS 'Admins can delete announcements (checks user_profiles.role)';
