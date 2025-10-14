-- Migration: Create association_fees table
-- Feature: 001-residential-community-management
-- Phase: 7 - User Story 5 (Admin Communication & Financial Management)
-- Task: T141

-- Create association_fees table
CREATE TABLE IF NOT EXISTS association_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('monthly', 'annual', 'special_assessment')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  due_date DATE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'overdue')),
  paid_at TIMESTAMPTZ DEFAULT NULL,
  payment_method TEXT DEFAULT NULL,
  receipt_url TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_association_fees_tenant_id ON association_fees(tenant_id);
CREATE INDEX idx_association_fees_household_id ON association_fees(household_id);
CREATE INDEX idx_association_fees_due_date ON association_fees(due_date);
CREATE INDEX idx_association_fees_payment_status ON association_fees(payment_status);
CREATE INDEX idx_association_fees_paid_at ON association_fees(paid_at);

-- Enable Row-Level Security
ALTER TABLE association_fees ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can manage all association fees
CREATE POLICY association_fees_admin_all ON association_fees
  FOR ALL
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('admin_head', 'admin_officer')
  );

-- RLS Policy: Household heads can view their own fees
CREATE POLICY association_fees_household_read ON association_fees
  FOR SELECT
  USING (
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
  );

-- RLS Policy: Household members can view their household's fees
CREATE POLICY association_fees_household_member_read ON association_fees
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_association_fees_updated_at
  BEFORE UPDATE ON association_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update payment_status to overdue
CREATE OR REPLACE FUNCTION update_overdue_fees()
RETURNS void AS $$
BEGIN
  UPDATE association_fees
  SET payment_status = 'overdue'
  WHERE payment_status = 'unpaid'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE association_fees IS 'HOA association fees owed by households with payment tracking';
COMMENT ON COLUMN association_fees.fee_type IS 'Type of fee: monthly, annual, or special_assessment';
COMMENT ON COLUMN association_fees.amount IS 'Fee amount in local currency';
COMMENT ON COLUMN association_fees.due_date IS 'Date when payment is due';
COMMENT ON COLUMN association_fees.payment_status IS 'Payment status: unpaid, paid, or overdue';
COMMENT ON COLUMN association_fees.paid_at IS 'Timestamp when payment was received';
COMMENT ON COLUMN association_fees.payment_method IS 'Payment method used (e.g., Stripe, Bank Transfer, Cash)';
COMMENT ON COLUMN association_fees.receipt_url IS 'URL to payment receipt document in Supabase Storage';
COMMENT ON FUNCTION update_overdue_fees() IS 'Utility function to mark unpaid fees as overdue when past due date';
