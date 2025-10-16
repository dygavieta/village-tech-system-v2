-- Migration: Fix village_rules RLS policies for residents and security
-- The policies are using 'role' but should use 'user_role' to match JWT structure

-- Drop the existing policies
DROP POLICY IF EXISTS village_rules_residents_read ON village_rules;
DROP POLICY IF EXISTS village_rules_security_read ON village_rules;

-- Recreate residents policy with correct JWT field
CREATE POLICY village_rules_residents_read ON village_rules
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND published_at IS NOT NULL
    AND effective_date <= CURRENT_DATE
    AND (auth.jwt() ->> 'user_role') IN ('household_head', 'household_member')
  );

-- Recreate security policy with correct JWT field
CREATE POLICY village_rules_security_read ON village_rules
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND published_at IS NOT NULL
    AND effective_date <= CURRENT_DATE
    AND (auth.jwt() ->> 'user_role') IN ('security_head', 'security_officer')
  );

COMMENT ON POLICY village_rules_residents_read ON village_rules IS 'Residents can view published and effective village rules within their tenant';
COMMENT ON POLICY village_rules_security_read ON village_rules IS 'Security officers can view published and effective village rules within their tenant';
