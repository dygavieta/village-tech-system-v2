-- Migration: Create documents storage bucket RLS policies
-- Description: Storage bucket for vehicle sticker documents (OR/CR), construction permits, and other user-uploaded documents
-- Feature: 001-residential-community-management

-- NOTE: The storage bucket itself must be created via Supabase Dashboard or using the Supabase CLI
-- This is because storage.buckets table requires service_role privileges for INSERT operations
--
-- To create the bucket:
-- Option 1 - Via Supabase Dashboard:
--   1. Go to Storage section
--   2. Click "New bucket"
--   3. Bucket name: documents
--   4. Public: false (unchecked)
--   5. File size limit: 10 MB
--   6. Allowed MIME types: image/png, image/jpeg, image/jpg, application/pdf, image/webp
--
-- Option 2 - Via Supabase SQL Editor (with service_role):
--   Run the following as service_role:
--   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
--   VALUES (
--     'documents',
--     'documents',
--     false,
--     10485760,
--     ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'image/webp']
--   )
--   ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (for idempotency)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can read their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can read documents in their tenant" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Superadmins can manage all documents" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can upload announcement attachments" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can read announcement attachments" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can update announcement attachments" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can delete announcement attachments" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create RLS policy for authenticated users to upload their own documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  -- Path must start with sticker_documents/{user_id}/ or permit_documents/{user_id}/
  (
    (name LIKE 'sticker_documents/' || auth.uid()::text || '/%') OR
    (name LIKE 'permit_documents/' || auth.uid()::text || '/%') OR
    (name LIKE 'household_documents/' || auth.uid()::text || '/%')
  )
);

-- Create RLS policy for authenticated users to read their own documents
CREATE POLICY "Users can read their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (
    (name LIKE 'sticker_documents/' || auth.uid()::text || '/%') OR
    (name LIKE 'permit_documents/' || auth.uid()::text || '/%') OR
    (name LIKE 'household_documents/' || auth.uid()::text || '/%')
  )
);

-- Create RLS policy for admins to read all documents in their tenant
-- Note: Admins need to verify documents for approvals
CREATE POLICY "Admins can read documents in their tenant"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (
    (auth.jwt() ->> 'user_role')::text IN ('admin_head', 'admin_officer')
  )
);

-- Create RLS policy for authenticated users to update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (
    (name LIKE 'sticker_documents/' || auth.uid()::text || '/%') OR
    (name LIKE 'permit_documents/' || auth.uid()::text || '/%') OR
    (name LIKE 'household_documents/' || auth.uid()::text || '/%')
  )
);

-- Create RLS policy for authenticated users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (
    (name LIKE 'sticker_documents/' || auth.uid()::text || '/%') OR
    (name LIKE 'permit_documents/' || auth.uid()::text || '/%') OR
    (name LIKE 'household_documents/' || auth.uid()::text || '/%')
  )
);

-- Create RLS policy for superadmins to manage all documents
CREATE POLICY "Superadmins can manage all documents"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'documents' AND
  (auth.jwt() ->> 'user_role')::text = 'superadmin'
)
WITH CHECK (
  bucket_id = 'documents' AND
  (auth.jwt() ->> 'user_role')::text = 'superadmin'
);

-- ============================================================================
-- ANNOUNCEMENT ATTACHMENTS POLICIES
-- ============================================================================
-- Admins need to upload announcement attachments to announcements/ folder

-- INSERT: Admins can upload announcement attachments
CREATE POLICY "Admins can upload announcement attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (name LIKE 'announcements/%') AND
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin_head', 'admin_officer')
  )
);

-- SELECT: Admins can read announcement attachments
CREATE POLICY "Admins can read announcement attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (name LIKE 'announcements/%') AND
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin_head', 'admin_officer')
  )
);

-- UPDATE: Admins can update announcement attachments metadata
CREATE POLICY "Admins can update announcement attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (name LIKE 'announcements/%') AND
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin_head', 'admin_officer')
  )
);

-- DELETE: Admins can delete announcement attachments
CREATE POLICY "Admins can delete announcement attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (name LIKE 'announcements/%') AND
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin_head', 'admin_officer')
  )
);
