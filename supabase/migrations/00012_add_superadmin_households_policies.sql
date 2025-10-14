-- Migration: Add superadmin access policies for households and related tables
-- Description: Allow superadmins to view and manage households, household_members, and beneficial_users across all tenants

-- Create policy for superadmin full access to households
CREATE POLICY superadmin_access_households ON households
  FOR ALL USING (
    auth.jwt() ->> 'user_role' = 'superadmin'
  );

-- Create policy for superadmin full access to household_members
CREATE POLICY superadmin_access_household_members ON household_members
  FOR ALL USING (
    auth.jwt() ->> 'user_role' = 'superadmin'
  );

-- Create policy for superadmin full access to beneficial_users
CREATE POLICY superadmin_access_beneficial_users ON beneficial_users
  FOR ALL USING (
    auth.jwt() ->> 'user_role' = 'superadmin'
  );

COMMENT ON POLICY superadmin_access_households ON households IS 'Superadmins can view and manage all households across all tenants';
COMMENT ON POLICY superadmin_access_household_members ON household_members IS 'Superadmins can view and manage all household members across all tenants';
COMMENT ON POLICY superadmin_access_beneficial_users ON beneficial_users IS 'Superadmins can view and manage all beneficial users across all tenants';
