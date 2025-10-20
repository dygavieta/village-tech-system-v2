-- Migration: Add default sticker allocation setting to tenants
-- Description: Add tenant-level configuration for default household sticker allocation

-- Add default_sticker_allocation column to tenants table
ALTER TABLE tenants
ADD COLUMN default_sticker_allocation INTEGER NOT NULL DEFAULT 3 CHECK (default_sticker_allocation >= 1 AND default_sticker_allocation <= 20);

-- Create index for efficient lookups
CREATE INDEX idx_tenants_sticker_allocation ON tenants(default_sticker_allocation);

-- Comment
COMMENT ON COLUMN tenants.default_sticker_allocation IS 'Default number of vehicle stickers allocated to new households (1-20)';

-- Update existing households that have the default value (3) to reference tenant setting
-- This ensures consistency but keeps any manually overridden allocations
UPDATE households h
SET sticker_allocation = t.default_sticker_allocation
FROM tenants t
WHERE h.tenant_id = t.id
AND h.sticker_allocation = 3
AND t.default_sticker_allocation != 3;
