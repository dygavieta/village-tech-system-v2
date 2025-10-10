-- Migration: Create tenants table
-- Description: Tenancy & Platform Management domain

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  subdomain TEXT UNIQUE NOT NULL,
  community_type TEXT NOT NULL CHECK (community_type IN ('HOA', 'Condo', 'Gated Village', 'Subdivision')),
  total_residences INTEGER NOT NULL DEFAULT 0,
  year_established INTEGER,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  max_residences INTEGER NOT NULL,
  max_admin_users INTEGER NOT NULL,
  max_security_users INTEGER NOT NULL,
  storage_quota_gb INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_created_at ON tenants(created_at);

-- Comments
COMMENT ON TABLE tenants IS 'Residential communities (HOAs) - multi-tenant root table';
COMMENT ON COLUMN tenants.subdomain IS 'Unique subdomain for admin portal (e.g., greenfield.villagetech.com)';
COMMENT ON COLUMN tenants.max_residences IS 'Subscription limit for number of properties';
