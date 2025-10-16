-- Migration: Fix village_rules RLS policy for INSERT operations
-- The existing policy only has USING clause which doesn't work for INSERT
-- We need to add WITH CHECK clause for INSERT operations

-- Drop the existing policy
DROP POLICY IF EXISTS village_rules_admin_all ON village_rules;

-- Recreate with proper WITH CHECK clause for inserts
CREATE POLICY village_rules_admin_all ON village_rules
  FOR ALL
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'user_role') IN ('admin_head', 'admin_officer')
  )
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'user_role') IN ('admin_head', 'admin_officer')
  );

COMMENT ON POLICY village_rules_admin_all ON village_rules IS 'Admins can create, read, update, and delete village rules within their tenant';
