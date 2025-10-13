-- Migration: Create gates, vehicle stickers, entry/exit logs, and guests
-- Description: Access Control & Gate Management domain

-- Create gates table
CREATE TABLE IF NOT EXISTS gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gate_type TEXT NOT NULL CHECK (gate_type IN ('primary', 'secondary', 'service', 'emergency')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  operating_hours_start TIME,
  operating_hours_end TIME,
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  rfid_reader_serial TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for gates
CREATE INDEX idx_gates_tenant_id ON gates(tenant_id);
CREATE INDEX idx_gates_status ON gates(status);
CREATE INDEX idx_gates_rfid_reader_serial ON gates(rfid_reader_serial);

-- Enable RLS for gates
ALTER TABLE gates ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_gates ON gates
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Create vehicle_stickers table
CREATE TABLE IF NOT EXISTS vehicle_stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  beneficial_user_id UUID REFERENCES beneficial_users(id) ON DELETE CASCADE,
  rfid_serial TEXT UNIQUE NOT NULL,
  vehicle_plate TEXT NOT NULL,
  vehicle_make TEXT,
  vehicle_color TEXT,
  sticker_type TEXT NOT NULL CHECK (sticker_type IN ('resident_permanent', 'beneficial_user', 'temporary_guest', 'contractor')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ready_for_pickup', 'issued', 'expired', 'lost', 'deactivated')),
  issue_date DATE,
  expiry_date DATE,
  or_cr_document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sticker_ownership CHECK (
    (household_id IS NOT NULL AND beneficial_user_id IS NULL) OR
    (household_id IS NULL AND beneficial_user_id IS NOT NULL)
  )
);

-- Create indexes for vehicle_stickers
CREATE INDEX idx_vehicle_stickers_tenant_id ON vehicle_stickers(tenant_id);
CREATE INDEX idx_vehicle_stickers_rfid_serial ON vehicle_stickers(rfid_serial);
CREATE INDEX idx_vehicle_stickers_household_id ON vehicle_stickers(household_id);
CREATE INDEX idx_vehicle_stickers_status ON vehicle_stickers(status);
CREATE INDEX idx_vehicle_stickers_vehicle_plate ON vehicle_stickers(vehicle_plate);

-- Enable RLS for vehicle_stickers
ALTER TABLE vehicle_stickers ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_vehicle_stickers ON vehicle_stickers
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY household_access_vehicle_stickers ON vehicle_stickers
  FOR SELECT USING (
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
  );

CREATE POLICY admin_access_vehicle_stickers ON vehicle_stickers
  FOR ALL USING (
    auth.jwt() ->> 'user_role' IN ('admin_head', 'admin_officer')
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  phone_number TEXT,
  vehicle_plate TEXT,
  visit_type TEXT NOT NULL CHECK (visit_type IN ('day_trip', 'multi_day')),
  visit_date DATE NOT NULL,
  expected_arrival_time TIME,
  actual_arrival_time TIMESTAMPTZ,
  checkout_date DATE,
  actual_departure_time TIMESTAMPTZ,
  status TEXT DEFAULT 'pre_registered' CHECK (status IN ('pre_registered', 'arrived', 'departed', 'overstayed', 'rejected')),
  approved_by_household BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for guests
CREATE INDEX idx_guests_tenant_id ON guests(tenant_id);
CREATE INDEX idx_guests_household_id ON guests(household_id);
CREATE INDEX idx_guests_visit_date ON guests(visit_date);
CREATE INDEX idx_guests_status ON guests(status);

-- Enable RLS for guests
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_guests ON guests
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY household_access_guests ON guests
  FOR ALL USING (
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
  );

CREATE POLICY security_access_guests ON guests
  FOR SELECT USING (
    auth.jwt() ->> 'user_role' IN ('security_head', 'security_officer')
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Create entry_exit_logs table
CREATE TABLE IF NOT EXISTS entry_exit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  gate_id UUID NOT NULL REFERENCES gates(id) ON DELETE RESTRICT,
  sticker_id UUID REFERENCES vehicle_stickers(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('resident', 'guest', 'delivery', 'construction_worker', 'emergency')),
  direction TEXT NOT NULL CHECK (direction IN ('entry', 'exit')),
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  guard_on_duty_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  vehicle_plate TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for entry_exit_logs
CREATE INDEX idx_entry_exit_logs_tenant_id ON entry_exit_logs(tenant_id);
CREATE INDEX idx_entry_exit_logs_gate_id ON entry_exit_logs(gate_id);
CREATE INDEX idx_entry_exit_logs_timestamp ON entry_exit_logs(timestamp);
CREATE INDEX idx_entry_exit_logs_entry_type ON entry_exit_logs(entry_type);

-- Enable RLS for entry_exit_logs
ALTER TABLE entry_exit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_entry_exit_logs ON entry_exit_logs
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY security_access_entry_exit_logs ON entry_exit_logs
  FOR ALL USING (
    auth.jwt() ->> 'user_role' IN ('security_head', 'security_officer', 'admin_head', 'admin_officer')
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Comments
COMMENT ON TABLE gates IS 'Physical entry/exit points in the community';
COMMENT ON TABLE vehicle_stickers IS 'RFID/QR stickers for vehicle access';
COMMENT ON TABLE guests IS 'Pre-registered or walk-in guests';
COMMENT ON TABLE entry_exit_logs IS 'Record of all gate entries and exits';
