-- Seed data for local development
-- This file will be executed after migrations

-- ============================================
-- Sample Tenant for Testing
-- ============================================
INSERT INTO public.tenants (
  id,
  name,
  legal_name,
  subdomain,
  community_type,
  total_residences,
  year_established,
  timezone,
  language,
  logo_url,
  primary_color,
  max_residences,
  max_admin_users,
  max_security_users,
  storage_quota_gb,
  created_at,
  updated_at
) VALUES (
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'Demo Village',
  'Demo Village Homeowners Association Inc.',
  'demo',
  'Gated Village',
  250,
  2020,
  'Asia/Manila',
  'en',
  NULL,
  '#3B82F6',
  300,
  10,
  20,
  50,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Default Superadmin User
-- ============================================
-- Email: superadmin@villagetech.com
-- Password: SuperAdmin123!
-- WARNING: Change this password immediately in production!
-- ============================================

DO $$
DECLARE
  new_user_id uuid;
  existing_user_id uuid;
BEGIN
  -- Check if pgcrypto extension is available (it should be from migrations)
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    RAISE EXCEPTION 'pgcrypto extension is required but not installed';
  END IF;

  -- Check if user already exists
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'superadmin@villagetech.com';

  IF existing_user_id IS NOT NULL THEN
    -- Update existing user
    UPDATE auth.users
    SET encrypted_password = crypt('SuperAdmin123!', gen_salt('bf')),
        email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = existing_user_id;

    new_user_id := existing_user_id;
    RAISE NOTICE 'Updated existing superadmin user: superadmin@villagetech.com';
  ELSE
    -- Create new auth user with proper bcrypt password hash
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'superadmin@villagetech.com',
      crypt('SuperAdmin123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO new_user_id;

    RAISE NOTICE 'Created new superadmin user: superadmin@villagetech.com';
  END IF;

  -- Create or update user profile linked to auth user
  INSERT INTO public.user_profiles (
    id,
    tenant_id,
    "role",
    first_name,
    middle_name,
    last_name,
    phone_number,
    position,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    NULL,  -- Superadmin has no tenant (required by CHECK constraint)
    'superadmin',
    'Super',
    NULL,
    'Admin',
    '+1234567890',
    'Platform Administrator',
    NOW(),
    NOW()
  )
  ON CONFLICT (id)
  DO UPDATE SET
    "role" = 'superadmin',
    first_name = 'Super',
    last_name = 'Admin',
    position = 'Platform Administrator',
    updated_at = NOW();

  RAISE NOTICE 'Superadmin profile created/updated successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create superadmin user: %', SQLERRM;
END $$;
