-- Migration: Create tenant-assets storage bucket
-- Description: Storage bucket for tenant logos and branding assets

-- Create storage bucket for tenant assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-assets',
  'tenant-assets',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy to allow authenticated superadmins to upload
CREATE POLICY "Superadmins can upload tenant assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-assets' AND
  auth.jwt() ->> 'user_role' = 'superadmin'
);

-- Create RLS policy to allow authenticated superadmins to update
CREATE POLICY "Superadmins can update tenant assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-assets' AND
  auth.jwt() ->> 'user_role' = 'superadmin'
);

-- Create RLS policy to allow authenticated superadmins to delete
CREATE POLICY "Superadmins can delete tenant assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-assets' AND
  auth.jwt() ->> 'user_role' = 'superadmin'
);

-- Create RLS policy to allow public read access
CREATE POLICY "Public can view tenant assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tenant-assets');
