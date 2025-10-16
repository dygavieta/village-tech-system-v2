-- Migration: Create curfews and curfew_exceptions tables
-- Feature: 001-residential-community-management
-- Phase: 7 - User Story 5 (Admin Communication & Monitoring)
-- Task: T152a, T152b
-- FR-037: System MUST enable curfew settings configuration with hours, exceptions, and seasonal adjustments

-- Create curfews table
CREATE TABLE IF NOT EXISTS curfews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by_admin_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,

  -- Basic information
  name TEXT NOT NULL,
  description TEXT,

  -- Time settings
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Days of week (array of lowercase day names)
  days_of_week TEXT[] NOT NULL DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],

  -- Seasonal settings
  season TEXT NOT NULL DEFAULT 'all_year' CHECK (season IN ('all_year', 'summer', 'winter', 'custom')),
  season_start_date DATE, -- Required if season = 'custom'
  season_end_date DATE,   -- Required if season = 'custom'

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  CONSTRAINT valid_days_of_week CHECK (
    days_of_week <@ ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    AND array_length(days_of_week, 1) > 0
  ),
  CONSTRAINT valid_custom_season CHECK (
    (season = 'custom' AND season_start_date IS NOT NULL AND season_end_date IS NOT NULL)
    OR (season != 'custom' AND season_start_date IS NULL AND season_end_date IS NULL)
  ),
  CONSTRAINT valid_season_dates CHECK (
    season != 'custom' OR season_start_date < season_end_date
  )
);

-- Create curfew_exceptions table
CREATE TABLE IF NOT EXISTS curfew_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curfew_id UUID NOT NULL REFERENCES curfews(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by_admin_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,

  -- Exception details
  exception_date DATE NOT NULL,
  reason TEXT NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one exception per date per curfew
  UNIQUE(curfew_id, exception_date)
);

-- Create indexes for performance
CREATE INDEX idx_curfews_tenant_id ON curfews(tenant_id);
CREATE INDEX idx_curfews_is_active ON curfews(is_active);
CREATE INDEX idx_curfews_season ON curfews(season);
CREATE INDEX idx_curfews_days_of_week ON curfews USING GIN(days_of_week);

CREATE INDEX idx_curfew_exceptions_curfew_id ON curfew_exceptions(curfew_id);
CREATE INDEX idx_curfew_exceptions_tenant_id ON curfew_exceptions(tenant_id);
CREATE INDEX idx_curfew_exceptions_date ON curfew_exceptions(exception_date);

-- Enable Row-Level Security
ALTER TABLE curfews ENABLE ROW LEVEL SECURITY;
ALTER TABLE curfew_exceptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for curfews

-- Admins can manage all curfews in their tenant
CREATE POLICY curfews_admin_all ON curfews
  FOR ALL
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'user_role') IN ('admin_head', 'admin_officer')
  )
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'user_role') IN ('admin_head', 'admin_officer')
  );

-- Residents can view active curfews
CREATE POLICY curfews_residents_read ON curfews
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND is_active = true
    AND (auth.jwt() ->> 'user_role') IN ('household_head', 'household_member')
  );

-- Security officers can view active curfews
CREATE POLICY curfews_security_read ON curfews
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND is_active = true
    AND (auth.jwt() ->> 'user_role') IN ('security_head', 'security_officer')
  );

-- RLS Policies for curfew_exceptions

-- Admins can manage all exceptions in their tenant
CREATE POLICY curfew_exceptions_admin_all ON curfew_exceptions
  FOR ALL
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'user_role') IN ('admin_head', 'admin_officer')
  )
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'user_role') IN ('admin_head', 'admin_officer')
  );

-- Residents can view exceptions for active curfews
CREATE POLICY curfew_exceptions_residents_read ON curfew_exceptions
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'user_role') IN ('household_head', 'household_member')
    AND curfew_id IN (SELECT id FROM curfews WHERE is_active = true)
  );

-- Security officers can view exceptions for active curfews
CREATE POLICY curfew_exceptions_security_read ON curfew_exceptions
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'user_role') IN ('security_head', 'security_officer')
    AND curfew_id IN (SELECT id FROM curfews WHERE is_active = true)
  );

-- Triggers to update updated_at timestamp
CREATE TRIGGER update_curfews_updated_at
  BEFORE UPDATE ON curfews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curfew_exceptions_updated_at
  BEFORE UPDATE ON curfew_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE curfews IS 'Curfew time restrictions for community access control with seasonal and day-of-week settings';
COMMENT ON COLUMN curfews.name IS 'Descriptive name for the curfew (e.g., "Standard Weekday Curfew", "Summer Weekend Hours")';
COMMENT ON COLUMN curfews.start_time IS 'Time when curfew begins (e.g., 22:00)';
COMMENT ON COLUMN curfews.end_time IS 'Time when curfew ends (e.g., 06:00 next day)';
COMMENT ON COLUMN curfews.days_of_week IS 'Array of days when curfew applies (lowercase: monday, tuesday, etc.)';
COMMENT ON COLUMN curfews.season IS 'Season when curfew applies: all_year, summer, winter, or custom';
COMMENT ON COLUMN curfews.season_start_date IS 'Start date for custom seasonal curfew (required if season=custom)';
COMMENT ON COLUMN curfews.season_end_date IS 'End date for custom seasonal curfew (required if season=custom)';
COMMENT ON COLUMN curfews.is_active IS 'Whether this curfew is currently enforced';

COMMENT ON TABLE curfew_exceptions IS 'Exception dates when curfew rules do not apply (holidays, special events)';
COMMENT ON COLUMN curfew_exceptions.exception_date IS 'Date when the curfew exception applies';
COMMENT ON COLUMN curfew_exceptions.reason IS 'Reason for the exception (e.g., "National Holiday", "Community Festival")';
