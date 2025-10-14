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

-- ============================================
-- Sentinel App Security Officers
-- ============================================
-- These users are for the Sentinel mobile app
-- ============================================

DO $$
DECLARE
  tenant_id uuid := 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'; -- Demo Village
  security_head_id uuid;
  officer_a_id uuid;
  officer_b_id uuid;
  officer_main_id uuid;
BEGIN
  -- Security Head
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'security.head@villagetech.com',
    crypt('SecureHead123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}', '{}',
    NOW(), NOW(), '', '', '', ''
  )
  ON CONFLICT (email) DO UPDATE SET
    encrypted_password = crypt('SecureHead123!', gen_salt('bf')),
    updated_at = NOW()
  RETURNING id INTO security_head_id;

  INSERT INTO public.user_profiles (
    id, tenant_id, role, first_name, last_name, phone_number,
    position, created_at, updated_at
  ) VALUES (
    security_head_id, tenant_id, 'security_head',
    'John', 'Smith', '+1234567890',
    'Security Head', NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'security_head',
    position = 'Security Head',
    updated_at = NOW();

  RAISE NOTICE 'Security Head: security.head@villagetech.com';

  -- Officer Gate A
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'officer.gatea@villagetech.com',
    crypt('OfficerA123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}', '{}',
    NOW(), NOW(), '', '', '', ''
  )
  ON CONFLICT (email) DO UPDATE SET
    encrypted_password = crypt('OfficerA123!', gen_salt('bf')),
    updated_at = NOW()
  RETURNING id INTO officer_a_id;

  INSERT INTO public.user_profiles (
    id, tenant_id, role, first_name, last_name, phone_number,
    position, created_at, updated_at
  ) VALUES (
    officer_a_id, tenant_id, 'security_officer',
    'Mike', 'Johnson', '+1234567891',
    'Security Officer - Gate A', NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'security_officer',
    position = 'Security Officer - Gate A',
    updated_at = NOW();

  RAISE NOTICE 'Officer Gate A: officer.gatea@villagetech.com';

  -- Officer Gate B
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'officer.gateb@villagetech.com',
    crypt('OfficerB123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}', '{}',
    NOW(), NOW(), '', '', '', ''
  )
  ON CONFLICT (email) DO UPDATE SET
    encrypted_password = crypt('OfficerB123!', gen_salt('bf')),
    updated_at = NOW()
  RETURNING id INTO officer_b_id;

  INSERT INTO public.user_profiles (
    id, tenant_id, role, first_name, last_name, phone_number,
    position, created_at, updated_at
  ) VALUES (
    officer_b_id, tenant_id, 'security_officer',
    'Sarah', 'Williams', '+1234567892',
    'Security Officer - Gate B', NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'security_officer',
    position = 'Security Officer - Gate B',
    updated_at = NOW();

  RAISE NOTICE 'Officer Gate B: officer.gateb@villagetech.com';

  -- Officer Main Gate
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'officer.main@villagetech.com',
    crypt('OfficerMain123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}', '{}',
    NOW(), NOW(), '', '', '', ''
  )
  ON CONFLICT (email) DO UPDATE SET
    encrypted_password = crypt('OfficerMain123!', gen_salt('bf')),
    updated_at = NOW()
  RETURNING id INTO officer_main_id;

  INSERT INTO public.user_profiles (
    id, tenant_id, role, first_name, last_name, phone_number,
    position, created_at, updated_at
  ) VALUES (
    officer_main_id, tenant_id, 'security_officer',
    'David', 'Brown', '+1234567893',
    'Security Officer - Main Gate', NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'security_officer',
    position = 'Security Officer - Main Gate',
    updated_at = NOW();

  RAISE NOTICE 'Officer Main Gate: officer.main@villagetech.com';
  RAISE NOTICE 'All Sentinel security officers created successfully!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create security officers: %', SQLERRM;
END $$;
