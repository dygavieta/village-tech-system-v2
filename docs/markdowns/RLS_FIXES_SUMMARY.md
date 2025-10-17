# RLS Fixes Summary - All Resolved Issues

## Problem Pattern

Both **vehicle stickers** and **construction permits** had the same RLS issue:

```
Error: RLS policy details: forbidden
```

### Root Cause
1. Flutter/Dart apps don't send `tenant_id` in INSERT requests (security best practice)
2. RLS policies `tenant_isolation_*` (FOR ALL) require `tenant_id` match
3. RLS checks happen BEFORE data is inserted
4. Check fails → "forbidden" error

## Solution Pattern

For both tables, we applied the **same fix**:

1. **Split tenant_isolation policy** (remove FOR ALL, create separate SELECT/UPDATE/DELETE)
2. **Create trigger** to auto-populate `tenant_id` from JWT BEFORE INSERT
3. **Add INSERT policy** for household heads
4. **Add UPDATE/DELETE policies** for managing pending requests

---

## Migration Timeline

| Migration | Purpose | Status |
|-----------|---------|--------|
| **00023** | Documents storage bucket | ✅ Applied |
| **00024** | vehicle_stickers RLS + schema fixes | ✅ Applied |
| **00025** | vehicle_stickers tenant_id trigger | ✅ Applied |
| **00026** | construction_permits RLS + trigger | ⏳ **Apply Now** |

---

## Migration 00026: Construction Permits Fix

### What It Does:

1. **Splits tenant_isolation_construction_permits**
   - Before: FOR ALL (blocked INSERTs)
   - After: Separate SELECT/UPDATE/DELETE policies

2. **Creates Auto-Population Trigger**
   ```sql
   CREATE TRIGGER trigger_auto_populate_tenant_id_construction_permits
     BEFORE INSERT ON construction_permits
   ```
   - Extracts `tenant_id` from JWT
   - Adds it to the record before RLS checks

3. **Adds Household Policies**
   - `household_can_request_construction_permits` - Submit permits
   - `household_can_update_pending_permits` - Update before approval
   - `household_can_cancel_pending_permits` - Cancel requests

4. **Fixes construction_workers too**
   - Same trigger pattern
   - Allows admin INSERT for workers

---

## How to Apply

### Quick Fix (All Migrations):
```bash
cd /mnt/d/Ai\ Project/98Labs/village-tech-system-v2
npx supabase db reset
```

This applies **all migrations** including 00026.

### Incremental (Just 00026):
```bash
npx supabase db push
```

---

## Verification

### 1. Check Triggers Exist
```sql
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname LIKE '%auto_populate_tenant_id%';
```

**Expected: 3 triggers**
- vehicle_stickers
- construction_permits
- construction_workers

### 2. Check Policies
```sql
-- Vehicle Stickers
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'vehicle_stickers';
-- Expected: 8 policies

-- Construction Permits
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'construction_permits';
-- Expected: 8 policies
```

### 3. Test End-to-End

#### Vehicle Stickers (Already Working ✅):
1. Login as resident
2. Request vehicle sticker
3. Upload document
4. Submit → **Success**

#### Construction Permits (Will Work After 00026):
1. Login as resident
2. Request construction permit
3. Fill details (project type, dates, contractor, etc.)
4. Upload contractor license
5. Submit → **Should succeed** (no forbidden error)

---

## RLS Policy Structure (After All Fixes)

### vehicle_stickers (8 policies)
| Policy | Operation | Who |
|--------|-----------|-----|
| tenant_isolation_*_select | SELECT | All users |
| tenant_isolation_*_update | UPDATE | All users |
| tenant_isolation_*_delete | DELETE | All users |
| household_access_*_select | SELECT | Residents |
| household_can_request_stickers | INSERT | Residents |
| household_can_update_pending_stickers | UPDATE | Residents |
| household_can_cancel_pending_stickers | DELETE | Residents |
| admin_access_vehicle_stickers | ALL | Admins |

### construction_permits (8 policies)
| Policy | Operation | Who |
|--------|-----------|-----|
| tenant_isolation_*_select | SELECT | All users |
| tenant_isolation_*_update | UPDATE | All users |
| tenant_isolation_*_delete | DELETE | All users |
| household_access_*_select | SELECT | Residents |
| household_can_request_construction_permits | INSERT | Residents |
| household_can_update_pending_permits | UPDATE | Residents |
| household_can_cancel_pending_permits | DELETE | Residents |
| admin_access_construction_permits | ALL | Admins |

---

## Security Benefits

### Why Triggers Are Better Than Client-Side tenant_id:

1. **Single Source of Truth:** tenant_id always from authenticated JWT
2. **Can't Be Spoofed:** Client can't manipulate JWT claims
3. **Automatic:** No code changes needed in Flutter apps
4. **Consistent:** Same pattern across all tables
5. **Secure:** SECURITY DEFINER ensures proper execution

### What's Protected:

✅ **Tenant Isolation:** Users can't access other tenants' data
✅ **Household Isolation:** Residents can only manage their own requests
✅ **Status Protection:** Can't modify approved/active permits
✅ **Admin Privileges:** Only admins can approve/reject

---

## Troubleshooting

### Still Getting "Forbidden" After Applying 00026?

**Check:**
```sql
-- 1. Trigger exists
\df auto_populate_tenant_id_construction_permits

-- 2. Policies exist
SELECT policyname FROM pg_policies
WHERE tablename = 'construction_permits'
ORDER BY policyname;

-- 3. User is household head
SELECT * FROM households WHERE household_head_id = auth.uid();

-- 4. JWT has tenant_id
SELECT auth.jwt() ->> 'tenant_id';
```

### Trigger Not Firing?

Add debug logging:
```sql
CREATE OR REPLACE FUNCTION auto_populate_tenant_id_construction_permits()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'Trigger: tenant_id=%', (auth.jwt() ->> 'tenant_id')::uuid;
  NEW.tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;
  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id could not be determined from JWT';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Check PostgreSQL logs for NOTICE messages.

---

## Files Reference

### Migrations
- `supabase/migrations/00023_create_documents_storage.sql` - Storage bucket
- `supabase/migrations/00024_fix_vehicle_stickers_rls.sql` - Stickers RLS
- `supabase/migrations/00025_add_tenant_id_trigger.sql` - Stickers trigger
- `supabase/migrations/00026_fix_construction_permits_rls.sql` - **Permits fix**

### Documentation
- `STORAGE_BUCKET_FIX.md` - Storage bucket setup
- `VEHICLE_STICKERS_RLS_FIX.md` - Initial stickers fix
- `VEHICLE_STICKERS_RLS_FIX_V2.md` - Complete stickers solution
- `RLS_FIXES_SUMMARY.md` - This file (overview)

---

## Next Steps

1. **Apply migration 00026:**
   ```bash
   npx supabase db reset
   ```

2. **Test construction permit submission:**
   - From residence app
   - Should work without "forbidden" error

3. **Verify both workflows:**
   - ✅ Vehicle stickers (already working)
   - ✅ Construction permits (will work after 00026)

4. **Monitor for other RLS issues:**
   - Same pattern can be applied to other tables if needed
   - Look for "forbidden" errors during INSERT operations

---

## Pattern for Future Tables

If you encounter similar RLS issues on other tables:

1. **Check if table has tenant_id column**
2. **Check if client sends tenant_id in INSERT**
3. **If NO, apply this pattern:**
   - Split tenant_isolation policy
   - Create auto-population trigger
   - Add appropriate INSERT policies

This pattern is now proven and can be reused! 🎉
