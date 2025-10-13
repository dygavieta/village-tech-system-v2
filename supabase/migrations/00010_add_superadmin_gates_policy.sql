-- Migration: Add superadmin access policy for gates table
-- Description: Allow superadmins to view and manage all gates across all tenants

-- Create policy for superadmin full access to gates
CREATE POLICY superadmin_access_gates ON gates
  FOR ALL USING (
    auth.jwt() ->> 'user_role' = 'superadmin'
  );

COMMENT ON POLICY superadmin_access_gates ON gates IS 'Superadmins can view and manage all gates across all tenants';
