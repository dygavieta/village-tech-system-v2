-- Migration: Create user profiles and authentication
-- Description: Users & Authentication domain

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN (
    'superadmin',
    'admin_head',
    'admin_officer',
    'household_head',
    'household_member',
    'beneficial_user',
    'security_head',
    'security_officer'
  )),
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  phone_number TEXT,
  position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_profiles_tenant_id ON user_profiles(tenant_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see profiles in their tenant
CREATE POLICY tenant_isolation_user_profiles ON user_profiles
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Superadmins can see all profiles (no tenant_id filter)
CREATE POLICY superadmin_access_user_profiles ON user_profiles
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'superadmin'
  );

-- Comments
COMMENT ON TABLE user_profiles IS 'Extended user profiles for Supabase Auth users';
COMMENT ON COLUMN user_profiles.role IS 'User role for authorization and RLS policies';
COMMENT ON COLUMN user_profiles.position IS 'Position title (e.g., HOA President, Security Head)';
