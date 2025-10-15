# Vehicle Stickers RLS Policy Fix

## Problem
When residents tried to submit vehicle sticker requests from the residence app, they received an error:
```
RLS policy vehicle_stickers details: forbidden
hint: null
```

## Root Causes

### 1. Missing INSERT Policy for Residents
The original RLS policies in `00004_create_gates_and_access_control.sql` only allowed:
- **SELECT** for household heads (read their own stickers)
- **ALL operations** for admins only

**Result:** Residents couldn't INSERT new sticker requests.

### 2. Schema Issues

#### Issue A: `rfid_serial` was NOT NULL
The schema defined `rfid_serial TEXT UNIQUE NOT NULL`, but:
- Residents don't have RFID serials when submitting requests
- RFID serials are assigned by admins during the approval process
- The Flutter model has `rfidSerial` as optional (`String?`)
- The `toJson()` method in the Dart model doesn't include `rfid_serial`

#### Issue B: Missing `approved_at` Field
The admin approval stats functions (`getApprovalStats()`, `getPermitStats()`) query for `approved_at` timestamp to calculate average response times, but this field didn't exist in the schema.

## Solution

### Migration: `00024_fix_vehicle_stickers_rls.sql`

This migration fixes all three issues:

### 1. Schema Fixes

#### Make `rfid_serial` Nullable
```sql
ALTER TABLE vehicle_stickers
  ALTER COLUMN rfid_serial DROP NOT NULL;
```

#### Update Unique Constraint
```sql
-- Drop old unique constraint
DROP CONSTRAINT IF EXISTS vehicle_stickers_rfid_serial_key;

-- Add partial unique index (only for non-NULL values)
CREATE UNIQUE INDEX vehicle_stickers_rfid_serial_unique
  ON vehicle_stickers(rfid_serial)
  WHERE rfid_serial IS NOT NULL;
```

This allows:
- Multiple NULL `rfid_serial` values (pending requests)
- Unique RFID serials once assigned by admins

#### Add `approved_at` Timestamp
```sql
ALTER TABLE vehicle_stickers ADD COLUMN approved_at TIMESTAMPTZ;
```

### 2. RLS Policy Fixes

#### New Policies Created:

1. **`household_access_vehicle_stickers_select`**
   - **Operation:** SELECT
   - **Who:** Household heads
   - **What:** View their own household's stickers
   ```sql
   FOR SELECT USING (
     household_id IN (
       SELECT id FROM households WHERE household_head_id = auth.uid()
     )
   )
   ```

2. **`household_can_request_stickers`**
   - **Operation:** INSERT
   - **Who:** Household heads
   - **What:** Submit new sticker requests
   - **Checks:**
     - User is authenticated
     - household_id belongs to the user
     - tenant_id matches user's tenant
   ```sql
   FOR INSERT WITH CHECK (
     auth.uid() IS NOT NULL
     AND household_id IN (
       SELECT id FROM households WHERE household_head_id = auth.uid()
     )
     AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
   )
   ```

3. **`household_can_update_pending_stickers`**
   - **Operation:** UPDATE
   - **Who:** Household heads
   - **What:** Update their own pending sticker requests (before approval)
   - **Restriction:** Only `status = 'pending'`

4. **`household_can_cancel_pending_stickers`**
   - **Operation:** DELETE
   - **Who:** Household heads
   - **What:** Cancel their own pending requests
   - **Restriction:** Only `status = 'pending'`

### Existing Policies (Unchanged):

- **`tenant_isolation_vehicle_stickers`**: Ensures tenant isolation
- **`admin_access_vehicle_stickers`**: Admins have full access

## How to Apply

### Local Development:
```bash
cd /path/to/village-tech-system-v2
npx supabase db reset
```

### Production/Hosted Supabase:
```bash
npx supabase db push
```

Or manually run the migration in Supabase SQL Editor.

## Verification

### 1. Check Schema Changes

```sql
-- Check rfid_serial is nullable
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'vehicle_stickers'
  AND column_name = 'rfid_serial';
```

**Expected:** `is_nullable = 'YES'`

```sql
-- Check approved_at field exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vehicle_stickers'
  AND column_name = 'approved_at';
```

**Expected:** One row with `data_type = 'timestamp with time zone'`

```sql
-- Check unique index on rfid_serial
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'vehicle_stickers'
  AND indexname = 'vehicle_stickers_rfid_serial_unique';
```

**Expected:** Index with WHERE clause: `WHERE (rfid_serial IS NOT NULL)`

### 2. Check RLS Policies

```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'vehicle_stickers'
ORDER BY policyname;
```

**Expected Policies:**
| policyname | cmd | Description |
|------------|-----|-------------|
| admin_access_vehicle_stickers | ALL | Admins full access |
| household_access_vehicle_stickers_select | SELECT | Residents view own |
| household_can_cancel_pending_stickers | DELETE | Cancel pending |
| household_can_request_stickers | INSERT | Submit requests |
| household_can_update_pending_stickers | UPDATE | Update pending |
| tenant_isolation_vehicle_stickers | ALL | Tenant isolation |

### 3. Test from Residence App

1. Login as a household head
2. Navigate to Vehicle Stickers
3. Click "Request New Sticker"
4. Fill in vehicle details
5. Upload OR/CR document
6. Submit request

**Expected Results:**
- ✅ No RLS policy error
- ✅ Request created with `status = 'pending'`
- ✅ `rfid_serial` is NULL
- ✅ Request appears in admin approval queue

### 4. Test from Admin App

1. Login as admin
2. Go to Approvals → Stickers
3. See the newly submitted request
4. Approve the request (assign RFID serial)

**Expected Results:**
- ✅ Request visible to admin
- ✅ Admin can assign RFID serial
- ✅ Status updates to 'approved'
- ✅ `approved_at` timestamp is set

## Sticker Request Workflow

### Step 1: Resident Submits Request
- Resident fills out vehicle information
- Uploads OR/CR document
- Submits request
- **Database Record:**
  - `status = 'pending'`
  - `rfid_serial = NULL`
  - `approved_at = NULL`

### Step 2: Admin Reviews
- Admin sees request in approval queue
- Reviews vehicle details and documents
- Checks household allocation limit

### Step 3: Admin Approves
- Admin assigns RFID serial number
- Sets approval status
- **Database Updates:**
  - `status = 'approved'`
  - `rfid_serial = '{assigned-serial}'`
  - `approved_at = NOW()`

### Step 4: Sticker Issuance
- Status progresses through:
  - `approved` → `ready_for_pickup` → `issued`

## Security Considerations

### What Residents Can Do:
- ✅ View their own household's stickers
- ✅ Submit new sticker requests
- ✅ Update pending requests (before admin approval)
- ✅ Cancel pending requests
- ❌ Cannot modify approved/issued stickers
- ❌ Cannot view other households' stickers
- ❌ Cannot assign RFID serials

### What Admins Can Do:
- ✅ View all stickers in their tenant
- ✅ Approve/reject requests
- ✅ Assign RFID serials
- ✅ Update sticker status
- ✅ Modify any sticker field

### Tenant Isolation:
- All operations respect tenant boundaries
- Users can only access data within their tenant
- Enforced by `tenant_isolation_vehicle_stickers` policy

## Related Files

- **Migration:** `supabase/migrations/00024_fix_vehicle_stickers_rls.sql`
- **Original Schema:** `supabase/migrations/00004_create_gates_and_access_control.sql`
- **Residence App Model:** `apps/residence/lib/features/stickers/models/vehicle_sticker.dart`
- **Residence App Provider:** `apps/residence/lib/features/stickers/providers/sticker_provider.dart`
- **Admin Actions:** `apps/admin/src/lib/actions/approve-sticker.ts`
- **Approval Stats:** `apps/admin/src/lib/actions/approvals.ts`

## Troubleshooting

### Error: "RLS policy violation" persists after migration

**Check:**
1. Migration was applied: `SELECT * FROM pg_policies WHERE tablename = 'vehicle_stickers';`
2. User is authenticated: `SELECT auth.uid();` should return a UUID
3. User is a household head: `SELECT * FROM households WHERE household_head_id = auth.uid();`
4. Tenant ID in JWT: `SELECT auth.jwt() ->> 'tenant_id';`

### Error: "rfid_serial violates not-null constraint"

**Check:**
1. Migration was applied: `\d vehicle_stickers` should show `rfid_serial` as nullable
2. Clear app cache and restart
3. Verify Dart model's `toJson()` doesn't include `rfid_serial` field

### Error: "duplicate key value violates unique constraint"

**Check:**
1. RFID serial being assigned is unique
2. Partial unique index exists: `\d vehicle_stickers` should show `vehicle_stickers_rfid_serial_unique`

### Stats show "N/A" for avg response time

**Check:**
1. `approved_at` field exists: `\d vehicle_stickers`
2. There are approved stickers: `SELECT COUNT(*) FROM vehicle_stickers WHERE status = 'approved' AND approved_at IS NOT NULL;`

## Next Steps

- ✅ Migration created
- ✅ Schema fixed (nullable rfid_serial, approved_at added)
- ✅ RLS policies fixed (INSERT, UPDATE, DELETE for residents)
- ⏳ Apply migration (`npx supabase db reset` or `db push`)
- ⏳ Test sticker submission from residence app
- ⏳ Test approval flow from admin app
- ⏳ Verify stats calculation works correctly
