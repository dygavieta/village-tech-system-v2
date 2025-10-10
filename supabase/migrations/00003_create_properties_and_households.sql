-- Migration: Create properties, households, and household members
-- Description: Property & Household Management domain

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  phase TEXT,
  block TEXT,
  lot TEXT,
  unit TEXT,
  property_type TEXT NOT NULL CHECK (property_type IN ('single_family', 'townhouse', 'condo', 'lot_only')),
  property_size_sqm NUMERIC,
  lot_size_sqm NUMERIC,
  bedrooms INTEGER,
  bathrooms INTEGER,
  parking_slots INTEGER DEFAULT 0,
  status TEXT DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied', 'under_construction', 'for_sale')),
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for properties
CREATE INDEX idx_properties_tenant_id ON properties(tenant_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_address ON properties(address);

-- Enable RLS for properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_properties ON properties
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Create households table
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  household_head_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  move_in_date DATE,
  ownership_type TEXT NOT NULL CHECK (ownership_type IN ('owner', 'renter')),
  sticker_allocation INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for households
CREATE INDEX idx_households_tenant_id ON households(tenant_id);
CREATE INDEX idx_households_property_id ON households(property_id);
CREATE INDEX idx_households_household_head_id ON households(household_head_id);

-- Enable RLS for households
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_households ON households
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY household_head_access_households ON households
  FOR SELECT USING (
    household_head_id = auth.uid()
  );

CREATE POLICY admin_access_households ON households
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin_head', 'admin_officer')
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Create household_members table
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('spouse', 'child', 'parent', 'sibling', 'other')),
  age INTEGER,
  is_minor BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for household_members
CREATE INDEX idx_household_members_tenant_id ON household_members(tenant_id);
CREATE INDEX idx_household_members_household_id ON household_members(household_id);
CREATE INDEX idx_household_members_user_id ON household_members(user_id);

-- Enable RLS for household_members
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_household_members ON household_members
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Create beneficial_users table
CREATE TABLE IF NOT EXISTS beneficial_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  government_id_url TEXT,
  reason TEXT NOT NULL CHECK (reason IN ('helper', 'driver', 'caregiver', 'family')),
  access_start_date DATE NOT NULL,
  access_end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for beneficial_users
CREATE INDEX idx_beneficial_users_tenant_id ON beneficial_users(tenant_id);
CREATE INDEX idx_beneficial_users_household_id ON beneficial_users(household_id);

-- Enable RLS for beneficial_users
ALTER TABLE beneficial_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_beneficial_users ON beneficial_users
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Comments
COMMENT ON TABLE properties IS 'Physical residences/addresses within a community';
COMMENT ON TABLE households IS 'Groups of residents assigned to a property';
COMMENT ON TABLE household_members IS 'Family members within a household';
COMMENT ON TABLE beneficial_users IS 'Non-residents with vehicle access (helpers, drivers)';
