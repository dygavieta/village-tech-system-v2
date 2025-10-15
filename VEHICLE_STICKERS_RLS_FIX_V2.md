# Vehicle Stickers RLS Fix V2 - tenant_id Auto-Population

## Problem (Still Occurring After First Fix)

Even after applying migration `00024`, residents still got:
```
RLS policy vehicle_stickers details: forbidden
hint: null
```

## Root Cause Analysis

### The Missing Piece: `tenant_id`

The Dart model's `toJson()` method doesn't include `tenant_id`:

```dart
Map<String, dynamic> toJson() {
  return {
    'household_id': householdId,
    'vehicle_plate': vehiclePlate,
    'vehicle_make': vehicleMake,
    'vehicle_color': vehicleColor,
    'sticker_type': stickerType,
    'or_cr_document_url': orCrDocumentUrl,
  };  // <-- NO tenant_id!
}
```

But the original RLS policy `tenant_isolation_vehicle_stickers` requires:
```sql
FOR ALL USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
)
```

**The Problem:**
- `FOR ALL` includes INSERT operations
- RLS checks the `tenant_id` field BEFORE the INSERT happens
- The INSERT data doesn't have `tenant_id`, so it fails the check

## Why Not Just Add tenant_id to the Dart Model?

**Security Best Practice:** The `tenant_id` should ALWAYS come from the authenticated JWT, never from user input. If we let clients provide it, they could potentially:
- Spoof tenant_id to access other tenants' data
- Create data inconsistencies
- Bypass tenant isolation

**Correct Approach:** Auto-populate `tenant_id` from the JWT on the server side.

## Solution: Migration `00025_add_tenant_id_trigger.sql`

### Step 1: Split the `tenant_isolation` Policy

The original policy was `FOR ALL` which includes INSERT. We split it:

```sql
-- Original (blocking)
DROP POLICY tenant_isolation_vehicle_stickers ON vehicle_stickers;

-- New (split by operation)
CREATE POLICY tenant_isolation_vehicle_stickers_select FOR SELECT ...
CREATE POLICY tenant_isolation_vehicle_stickers_update FOR UPDATE ...
CREATE POLICY tenant_isolation_vehicle_stickers_delete FOR DELETE ...
-- No INSERT policy for tenant_isolation (handled by trigger)
```

### Step 2: Create Trigger to Auto-Populate `tenant_id`

```sql
CREATE OR REPLACE FUNCTION auto_populate_tenant_id_vehicle_stickers()
RETURNS TRIGGER AS $$
BEGIN
  -- Get tenant_id from JWT and set it
  NEW.tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;

  -- Security check
  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id could not be determined from JWT';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_populate_tenant_id_vehicle_stickers
  BEFORE INSERT ON vehicle_stickers
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_tenant_id_vehicle_stickers();
```

**How It Works:**
1. User submits INSERT without `tenant_id`
2. Trigger runs BEFORE INSERT
3. Trigger extracts `tenant_id` from JWT
4. Trigger adds `tenant_id` to the NEW record
5. RLS policies check the now-complete record
6. INSERT succeeds ✅

### Step 3: Update INSERT Policy

```sql
CREATE POLICY household_can_request_stickers ON vehicle_stickers
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND
    household_id IN (
      SELECT id FROM households WHERE household_head_id = auth.uid()
    )
    -- No tenant_id check here - trigger handles it
  );
```

## Complete RLS Policy List After Fix

| Policy Name | Operation | Who | Purpose |
|-------------|-----------|-----|---------|
| tenant_isolation_vehicle_stickers_select | SELECT | All users | Tenant isolation for reads |
| tenant_isolation_vehicle_stickers_update | UPDATE | All users | Tenant isolation for updates |
| tenant_isolation_vehicle_stickers_delete | DELETE | All users | Tenant isolation for deletes |
| household_access_vehicle_stickers_select | SELECT | Residents | View own stickers |
| household_can_request_stickers | INSERT | Residents | Submit requests |
| household_can_update_pending_stickers | UPDATE | Residents | Update pending |
| household_can_cancel_pending_stickers | DELETE | Residents | Cancel pending |
| admin_access_vehicle_stickers | ALL | Admins | Full admin access |

**Total: 8 policies** (was 6 before splitting tenant_isolation)

## How to Apply

### Option 1: Fresh Reset (Recommended for Local)
```bash
cd /path/to/village-tech-system-v2
npx supabase db reset
```

This applies all migrations including:
- 00023 - Documents storage bucket
- 00024 - vehicle_stickers RLS fixes and schema
- 00025 - tenant_id auto-population trigger

### Option 2: Push to Existing Database
```bash
npx supabase db push
```

## Verification

### 1. Check Trigger Exists
```sql
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgname = 'trigger_auto_populate_tenant_id_vehicle_stickers';
```

**Expected:** One row with `tgenabled = 'O'` (origin/enabled)

### 2. Check Function Exists
```sql
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'auto_populate_tenant_id_vehicle_stickers';
```

**Expected:** One row with the function definition

### 3. Check Policies
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'vehicle_stickers'
ORDER BY policyname;
```

**Expected: 8 policies** including the split tenant_isolation policies

### 4. Test INSERT Without tenant_id

```sql
-- This should work now (trigger adds tenant_id)
INSERT INTO vehicle_stickers (
  household_id,
  vehicle_plate,
  vehicle_make,
  sticker_type
) VALUES (
  '{your-household-id}',
  'TEST123',
  'Toyota',
  'resident_permanent'
);

-- Check that tenant_id was auto-populated
SELECT id, household_id, vehicle_plate, tenant_id
FROM vehicle_stickers
WHERE vehicle_plate = 'TEST123';
```

**Expected:**
- INSERT succeeds
- `tenant_id` is populated with your JWT's tenant_id

## End-to-End Test

### From Residence App:

1. **Login** as a resident (household head)
2. **Navigate** to Vehicle Stickers
3. **Click** "Request New Sticker"
4. **Fill** vehicle details:
   - Plate: ABC1234
   - Make: Toyota
   - Color: White
   - Type: Resident Permanent
5. **Upload** OR/CR document
6. **Submit** request

**Expected Results:**
- ✅ No "forbidden" error
- ✅ No "tenant_id" error
- ✅ Request created successfully
- ✅ Shows in pending list
- ✅ Visible in admin approval queue

### Verify in Database:

```sql
SELECT
  id,
  tenant_id,
  household_id,
  vehicle_plate,
  status,
  rfid_serial,
  created_at
FROM vehicle_stickers
WHERE vehicle_plate = 'ABC1234';
```

**Expected:**
- `tenant_id`: Populated (matches your tenant)
- `status`: 'pending'
- `rfid_serial`: NULL
- `created_at`: Recent timestamp

### From Admin App:

1. **Login** as admin
2. **Go to** Approvals → Stickers
3. **See** the ABC1234 request
4. **Approve** with RFID assignment

**Expected:**
- ✅ Request visible
- ✅ Can assign RFID
- ✅ Status updates to 'approved'
- ✅ `approved_at` timestamp set

## Security Considerations

### Why This Approach is Secure:

1. **tenant_id Source of Truth:** Always from JWT, never from user input
2. **Trigger Enforcement:** Runs before RLS, can't be bypassed
3. **SECURITY DEFINER:** Function runs with elevated privileges to set tenant_id
4. **Immutable in JWT:** tenant_id in JWT can't be manipulated by client
5. **RLS Still Active:** All other policies (household ownership, etc.) still enforced

### Attack Scenarios Prevented:

| Attack | Prevention |
|--------|-----------|
| User sends fake tenant_id | Trigger overwrites with JWT value |
| User omits tenant_id | Trigger adds from JWT |
| User tries to access other tenant | RLS policies block (tenant_isolation) |
| User tries to insert for other household | household_can_request_stickers blocks |

## Comparison with Alternative Approaches

| Approach | Pros | Cons |
|----------|------|------|
| **Trigger (Our Solution)** | ✅ Secure<br>✅ Client code unchanged<br>✅ Single source of truth | Slightly more complex |
| Add tenant_id to Dart model | Simple | ❌ Security risk<br>❌ Can be spoofed<br>❌ Client must manage it |
| Default value in SQL | Simple | ❌ Can't get JWT value<br>❌ Would need static value |
| Supabase Auth context | Works | ❌ Not available in RLS WITH CHECK<br>❌ Timing issues |

## Related Migrations

Apply in order:
1. **00023** - Documents storage bucket
2. **00024** - vehicle_stickers RLS policies + schema fixes
3. **00025** - tenant_id auto-population trigger (this one)

## Files Modified

- **Migration:** `supabase/migrations/00025_add_tenant_id_trigger.sql`
- **Related:** `supabase/migrations/00024_fix_vehicle_stickers_rls.sql`
- **Residence App:** `apps/residence/lib/features/stickers/providers/sticker_provider.dart` (unchanged - works as-is)
- **Model:** `apps/residence/lib/features/stickers/models/vehicle_sticker.dart` (unchanged)

## Troubleshooting

### Error: "tenant_id could not be determined from JWT"

**Cause:** JWT doesn't contain tenant_id claim

**Fix:**
1. Check JWT generation in `00007_custom_jwt_claims.sql`
2. Verify user profile has valid tenant_id
3. Re-login to get fresh JWT with claims

### Error: Still getting "forbidden"

**Check:**
1. All three migrations applied: `SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;`
2. Trigger exists: `\df auto_populate_tenant_id_vehicle_stickers`
3. User is household head: `SELECT * FROM households WHERE household_head_id = auth.uid();`
4. User is authenticated: `SELECT auth.uid();` returns UUID

### Trigger Not Firing

**Debug:**
```sql
-- Enable trigger logging
CREATE OR REPLACE FUNCTION auto_populate_tenant_id_vehicle_stickers()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'Trigger fired: tenant_id=%', (auth.jwt() ->> 'tenant_id')::uuid;
  NEW.tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;
  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id could not be determined from JWT';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Check logs for NOTICE messages.

## Next Steps

1. ✅ Migration created
2. ✅ Trigger auto-populates tenant_id
3. ✅ RLS policies split for proper INSERT handling
4. ⏳ Apply migration: `npx supabase db reset`
5. ⏳ Test sticker submission from residence app
6. ⏳ Verify tenant_id is auto-populated
7. ⏳ Test full approval workflow

This completes the RLS fix for vehicle stickers!
