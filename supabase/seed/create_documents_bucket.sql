-- Script to create the 'documents' storage bucket
-- This must be run with service_role privileges
--
-- Usage:
--   1. Via Supabase SQL Editor: Run this script in the SQL Editor
--   2. Via Supabase CLI: This will run automatically with seed data
--
-- This creates a private storage bucket for:
-- - Vehicle sticker documents (OR/CR)
-- - Construction permit documents
-- - Other household-related documents

-- Create the documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Private bucket, access controlled by RLS policies
  10485760, -- 10MB file size limit
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/pdf',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Verify the bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'documents';
