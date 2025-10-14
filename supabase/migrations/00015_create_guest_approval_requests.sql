-- Migration: Create guest_approval_requests table for User Story 4 (Gate Operations)
-- Description: Enable real-time guest approval workflow between security officers and households

-- Create guest_approval_requests table
CREATE TABLE IF NOT EXISTS guest_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  vehicle_plate TEXT,
  gate_id UUID NOT NULL REFERENCES gates(id) ON DELETE CASCADE,
  requested_by_guard_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'timeout')),
  response TEXT,
  timeout_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for guest_approval_requests
CREATE INDEX idx_guest_approval_requests_tenant_id ON guest_approval_requests(tenant_id);
CREATE INDEX idx_guest_approval_requests_household_id ON guest_approval_requests(household_id);
CREATE INDEX idx_guest_approval_requests_status ON guest_approval_requests(status);
CREATE INDEX idx_guest_approval_requests_created_at ON guest_approval_requests(created_at);
CREATE INDEX idx_guest_approval_requests_timeout_at ON guest_approval_requests(timeout_at);

-- Enable RLS for guest_approval_requests
ALTER TABLE guest_approval_requests ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation_guest_approval_requests ON guest_approval_requests
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Household access policy (households can view and respond to their approval requests)
CREATE POLICY household_access_guest_approval_requests ON guest_approval_requests
  FOR ALL USING (
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
  );

-- Security officer access policy (guards can create and view all requests)
CREATE POLICY security_access_guest_approval_requests ON guest_approval_requests
  FOR ALL USING (
    auth.jwt() ->> 'user_role' IN ('security_head', 'security_officer')
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Admin access policy (admins can view all requests for monitoring)
CREATE POLICY admin_access_guest_approval_requests ON guest_approval_requests
  FOR SELECT USING (
    auth.jwt() ->> 'user_role' IN ('admin_head', 'admin_officer')
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Enable Realtime for this table (critical for instant notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE guest_approval_requests;

-- Comments
COMMENT ON TABLE guest_approval_requests IS 'Real-time approval requests from security officers to households for unregistered guests';
COMMENT ON COLUMN guest_approval_requests.timeout_at IS 'Timestamp when the request times out (typically 2 minutes from creation)';
COMMENT ON COLUMN guest_approval_requests.status IS 'Request status: pending (awaiting response), approved, rejected, timeout (no response)';
