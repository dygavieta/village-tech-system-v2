-- Migration: Add superadmin access policy for properties table
-- Description: Allow superadmins to view and manage all properties across all tenants

-- Create policy for superadmin full access to properties
CREATE POLICY superadmin_access_properties ON properties
  FOR ALL USING (
    auth.jwt() ->> 'user_role' = 'superadmin'
  );

COMMENT ON POLICY superadmin_access_properties ON properties IS 'Superadmins can view and manage all properties across all tenants';
