-- Migration: Create payment_reminders table
-- Feature: 001-residential-community-management
-- Phase: 7 - User Story 5 (Payment Reminders)
-- Task: T154c

-- Create payment_reminders table to track sent reminders
CREATE TABLE IF NOT EXISTS payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_id UUID NOT NULL REFERENCES association_fees(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('upcoming', 'overdue')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT FALSE,
  sms_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_payment_reminders_fee_id ON payment_reminders(fee_id);
CREATE INDEX idx_payment_reminders_household_id ON payment_reminders(household_id);
CREATE INDEX idx_payment_reminders_tenant_id ON payment_reminders(tenant_id);
CREATE INDEX idx_payment_reminders_sent_at ON payment_reminders(sent_at DESC);
CREATE INDEX idx_payment_reminders_reminder_type ON payment_reminders(reminder_type);

-- Enable Row-Level Security
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view all payment reminders in their tenant
CREATE POLICY payment_reminders_admin_read ON payment_reminders
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('admin_head', 'admin_officer')
  );

-- RLS Policy: System/Edge Functions can insert reminders
CREATE POLICY payment_reminders_system_insert ON payment_reminders
  FOR INSERT
  WITH CHECK (true); -- Edge functions use service role key, bypassing RLS

-- RLS Policy: Household heads can view their own reminders
CREATE POLICY payment_reminders_household_read ON payment_reminders
  FOR SELECT
  USING (
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE payment_reminders IS 'Tracks payment reminder notifications sent to households';
COMMENT ON COLUMN payment_reminders.fee_id IS 'Reference to the association fee being reminded about';
COMMENT ON COLUMN payment_reminders.household_id IS 'Reference to the household receiving the reminder';
COMMENT ON COLUMN payment_reminders.reminder_type IS 'Type of reminder: upcoming (before due) or overdue';
COMMENT ON COLUMN payment_reminders.sent_at IS 'Timestamp when the reminder was sent';
COMMENT ON COLUMN payment_reminders.email_sent IS 'Whether email reminder was successfully sent';
COMMENT ON COLUMN payment_reminders.sms_sent IS 'Whether SMS reminder was successfully sent';
