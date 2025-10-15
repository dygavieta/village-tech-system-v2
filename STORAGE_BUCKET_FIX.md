# Storage Bucket Fix - Documents Bucket

## Problem
The residence app was throwing a `StorageException: Bucket not found 404` error when users tried to submit vehicle sticker requests with document uploads.

**Root Cause:** The app code at `apps/residence/lib/features/stickers/providers/sticker_provider.dart:50` was trying to upload to a storage bucket named `'documents'`, but this bucket didn't exist in Supabase.

## Solution
Created the `documents` storage bucket with proper RLS policies for secure document uploads.

## Implementation

### 1. Migration File (RLS Policies Only)
**File:** `supabase/migrations/00023_create_documents_storage.sql`

This migration creates all RLS policies for the documents bucket. The bucket itself must be created separately because standard migrations don't have service_role permissions to insert into `storage.buckets`.

**Policies Created:**
- Users can upload their own documents (sticker_documents, permit_documents, household_documents)
- Users can read/update/delete their own documents
- Admins can read all documents in their tenant (for approvals)
- Superadmins have full access to all documents

### 2. Seed Data (Bucket Creation)
**File:** `supabase/seed.sql`

Added bucket creation to the seed data file, which runs with service_role privileges:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET ...;
```

### 3. Manual Script (Optional)
**File:** `supabase/seed/create_documents_bucket.sql`

A standalone script for creating the bucket manually via Supabase SQL Editor if needed.

## How to Apply the Fix

### Option 1: Reset Local Database (Recommended for Local Dev)
```bash
cd /path/to/village-tech-system-v2
npx supabase db reset
```

This will:
1. Drop and recreate the database
2. Run all migrations (including 00023)
3. Run seed data (which creates the documents bucket)

### Option 2: Apply to Existing Database

**Step 1:** Create the bucket manually via Supabase Dashboard:
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Settings:
   - **Bucket name:** documents
   - **Public:** false (unchecked)
   - **File size limit:** 10 MB
   - **Allowed MIME types:** image/png, image/jpeg, image/jpg, application/pdf, image/webp

**Step 2:** Run the migration to add RLS policies:
```bash
npx supabase db push
```

### Option 3: For Production/Hosted Supabase

**Step 1:** Run the bucket creation script in Supabase SQL Editor:
```sql
-- Copy and paste contents from supabase/seed/create_documents_bucket.sql
```

**Step 2:** Push the migration:
```bash
npx supabase db push
```

## Verification

### Check if Bucket Exists
Run this query in Supabase SQL Editor:
```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'documents';
```

**Expected Result:**
| id | name | public | file_size_limit | allowed_mime_types |
|----|------|--------|----------------|-------------------|
| documents | documents | false | 10485760 | {image/png, image/jpeg, image/jpg, application/pdf, image/webp} |

### Check RLS Policies
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
  AND policyname LIKE '%documents%';
```

**Expected Policies:**
- Users can upload their own documents
- Users can read their own documents
- Admins can read documents in their tenant
- Users can update their own documents
- Users can delete their own documents
- Superadmins can manage all documents

### Test Upload from Residence App
1. Open the residence Flutter app
2. Navigate to Vehicle Stickers
3. Request a new sticker
4. Upload an OR/CR document
5. Submit the request

**Expected:** Upload succeeds without errors

## Document Storage Structure

Documents are organized by user and type:
```
documents/
├── sticker_documents/
│   └── {user_id}/
│       └── {filename}
├── permit_documents/
│   └── {user_id}/
│       └── {filename}
└── household_documents/
    └── {user_id}/
        └── {filename}
```

## Security
- Bucket is **private** (not publicly accessible)
- Users can only access their own documents (enforced by RLS)
- Admins can read all documents in their tenant (for approval workflows)
- Superadmins have full access
- File size limited to 10MB per file
- Only specific MIME types allowed (images and PDFs)

## Related Files
- **Residence App Code:** `apps/residence/lib/features/stickers/providers/sticker_provider.dart`
- **Migration:** `supabase/migrations/00023_create_documents_storage.sql`
- **Seed Data:** `supabase/seed.sql`
- **Manual Script:** `supabase/seed/create_documents_bucket.sql`

## Troubleshooting

### Error: "must be owner of table buckets"
This means you're trying to run the bucket creation without service_role privileges.

**Solution:** Use one of these approaches:
1. Run `npx supabase db reset` (recreates everything with proper permissions)
2. Create bucket via Supabase Dashboard (see Option 2 above)
3. Run the script in SQL Editor (which uses service_role)

### Error: "Bucket not found" after applying fix
**Check:**
1. Verify bucket exists: `SELECT * FROM storage.buckets WHERE id = 'documents';`
2. Verify RLS policies exist: `SELECT * FROM pg_policies WHERE tablename = 'objects';`
3. Clear app cache and restart

### Error: "Permission denied" when uploading
**Check:**
1. User is authenticated
2. File path follows the pattern: `sticker_documents/{user_id}/{filename}`
3. File MIME type is in the allowed list
4. File size is under 10MB

## Next Steps
- ✅ Bucket created with proper configuration
- ✅ RLS policies applied for security
- ✅ Seed data includes bucket creation
- ⏳ Test document uploads from residence app
- ⏳ Monitor storage usage and adjust limits if needed
