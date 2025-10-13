-- Migration: Add status and branding_config to tenants table
-- Description: Add missing columns for tenant status tracking and branding configuration

-- Add status column
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
CHECK (status IN ('active', 'inactive', 'suspended', 'setup'));

-- Add branding_config JSONB column for flexible branding options
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS branding_config JSONB DEFAULT '{}'::jsonb;

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Comments
COMMENT ON COLUMN tenants.status IS 'Tenant operational status: active, inactive, suspended, or setup';
COMMENT ON COLUMN tenants.branding_config IS 'JSONB configuration for tenant branding (logo_url, primary_color, secondary_color, etc)';

-- Update existing tenants to have default status if not set
UPDATE tenants SET status = 'active' WHERE status IS NULL;
