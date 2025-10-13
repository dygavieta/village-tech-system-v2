-- Migration: Add custom JWT claims
-- Description: Add role and tenant_id to JWT for RLS policies

-- Drop function if it exists (for clean re-creation)
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

-- Function to add custom claims to JWT
-- Must be in public schema and owned by postgres for auth hooks
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_tenant_id uuid;
BEGIN
  -- Fetch the user role and tenant_id from user_profiles
  SELECT "role", tenant_id INTO user_role, user_tenant_id
  FROM public.user_profiles
  WHERE id = (event->>'user_id')::uuid;

  -- Set the claims
  claims := event->'claims';

  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  END IF;

  -- Only set tenant_id if it's not null (superadmin has null tenant_id)
  IF user_tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id::text));
  END IF;

  -- Update the 'claims' object in the original event
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

-- Grant execute permission to supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO postgres;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO service_role;

-- Revoke execute from authenticated and anon roles for security
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon, public;

-- Comments
COMMENT ON FUNCTION public.custom_access_token_hook IS 'Adds custom claims (role, tenant_id) to JWT for RLS policies. Used by Supabase Auth hooks.';
