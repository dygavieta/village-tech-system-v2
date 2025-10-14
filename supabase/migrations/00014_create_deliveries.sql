-- Migration: Create deliveries table for User Story 4 (Gate Operations)
-- Description: Track delivery personnel, packages, and household responses

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  delivery_company TEXT,
  driver_name TEXT NOT NULL,
  vehicle_plate TEXT,
  package_description TEXT,
  household_response TEXT CHECK (household_response IN ('allow_entry', 'hold_at_gate', 'no_response')),
  entry_log_id UUID REFERENCES entry_exit_logs(id) ON DELETE SET NULL,
  exit_log_id UUID REFERENCES entry_exit_logs(id) ON DELETE SET NULL,
  hold_location TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_community', 'held_at_gate', 'delivered', 'departed', 'overstayed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for deliveries
CREATE INDEX idx_deliveries_tenant_id ON deliveries(tenant_id);
CREATE INDEX idx_deliveries_household_id ON deliveries(household_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_created_at ON deliveries(created_at);

-- Enable RLS for deliveries
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation_deliveries ON deliveries
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Household access policy (households can view their own deliveries)
CREATE POLICY household_access_deliveries ON deliveries
  FOR SELECT USING (
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
  );

-- Security officer access policy (guards can manage all deliveries)
CREATE POLICY security_access_deliveries ON deliveries
  FOR ALL USING (
    auth.jwt() ->> 'user_role' IN ('security_head', 'security_officer')
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Admin access policy (admins can view all deliveries for monitoring)
CREATE POLICY admin_access_deliveries ON deliveries
  FOR SELECT USING (
    auth.jwt() ->> 'user_role' IN ('admin_head', 'admin_officer')
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Add trigger for updated_at
CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE deliveries IS 'Track delivery personnel, packages, and household responses for gate management';
COMMENT ON COLUMN deliveries.household_response IS 'Household decision: allow_entry (deliver to door), hold_at_gate (pick up later), no_response (default after timeout)';
COMMENT ON COLUMN deliveries.status IS 'Delivery tracking status through the gate workflow';
