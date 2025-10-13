-- Migration: Create user profiles and authentication
-- Description: Users & Authentication domain

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  "role" TEXT NOT NULL CHECK ("role" IN (
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraint: tenant_id must be NULL for superadmins, and NOT NULL for all other roles
  CONSTRAINT tenant_id_for_role CHECK (
    ("role" = 'superadmin' AND tenant_id IS NULL) OR
    ("role" != 'superadmin' AND tenant_id IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX idx_user_profiles_tenant_id ON user_profiles(tenant_id);
CREATE INDEX idx_user_profiles_role ON user_profiles("role");

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Combined access control
-- Users can: (1) read their own profile, (2) access profiles in their tenant, (3) superadmins can access all
CREATE POLICY user_profiles_access_policy ON user_profiles
  FOR ALL USING (
    -- User can access their own profile
    auth.uid() = id
    OR
    -- Superadmin can access all profiles
    auth.jwt() ->> 'user_role' = 'superadmin'
    OR
    -- Users can access profiles in their tenant
    (tenant_id IS NOT NULL AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  );

-- Comments
COMMENT ON TABLE user_profiles IS 'Extended user profiles for Supabase Auth users';
COMMENT ON COLUMN user_profiles."role" IS 'User role for authorization and RLS policies';
COMMENT ON COLUMN user_profiles.position IS 'Position title (e.g., HOA President, Security Head)';
