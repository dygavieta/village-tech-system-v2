-- Migration: Fix announcements tenant isolation vulnerability
-- Description:
--   CRITICAL SECURITY FIX: The existing RLS policies allow admins from different
--   tenants to view each other's announcements. This migration adds tenant_id
--   filtering to all admin policies.
-- Issue: CVE-TENANT-LEAK - Cross-tenant data access in announcements table

-- Drop existing admin policies (they lack tenant isolation)
DROP POLICY IF EXISTS announcements_admin_insert ON announcements;
DROP POLICY IF EXISTS announcements_admin_select ON announcements;
DROP POLICY IF EXISTS announcements_admin_update ON announcements;
DROP POLICY IF EXISTS announcements_admin_delete ON announcements;

-- Create tenant-isolated policies for admins

-- INSERT: Admins can only create announcements for their own tenant
CREATE POLICY announcements_admin_insert ON announcements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin_head', 'admin_officer')
      AND user_profiles.tenant_id = announcements.tenant_id
    )
  );

-- SELECT: Admins can only view announcements from their own tenant
CREATE POLICY announcements_admin_select ON announcements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin_head', 'admin_officer')
      AND user_profiles.tenant_id = announcements.tenant_id
    )
  );

-- UPDATE: Admins can only update announcements from their own tenant
CREATE POLICY announcements_admin_update ON announcements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin_head', 'admin_officer')
      AND user_profiles.tenant_id = announcements.tenant_id
    )
  );

-- DELETE: Admins can only delete announcements from their own tenant
CREATE POLICY announcements_admin_delete ON announcements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin_head', 'admin_officer')
      AND user_profiles.tenant_id = announcements.tenant_id
    )
  );

-- Comments
COMMENT ON POLICY announcements_admin_insert ON announcements IS 'SECURITY: Admins can only create announcements for their own tenant';
COMMENT ON POLICY announcements_admin_select ON announcements IS 'SECURITY: Admins can only view announcements from their own tenant';
COMMENT ON POLICY announcements_admin_update ON announcements IS 'SECURITY: Admins can only update announcements from their own tenant';
COMMENT ON POLICY announcements_admin_delete ON announcements IS 'SECURITY: Admins can only delete announcements from their own tenant';
