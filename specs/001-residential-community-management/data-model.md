# Phase 1 Data Model: Residential Community Management Platform

**Feature**: 001-residential-community-management
**Date**: 2025-10-10
**Database**: PostgreSQL 15+ (Supabase)

## Overview

This document defines the database schema for the multi-tenant HOA management platform. All tables use **Row-Level Security (RLS)** policies to ensure tenant data isolation. The schema is organized into logical domains: Tenancy, Users, Households, Access Control, Permits, Communication, and Financials.

---

## Schema Domains

### 1. Tenancy & Platform Management

#### `tenants`
Represents a residential community (HOA).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique tenant identifier |
| `name` | TEXT | NOT NULL | Community name (e.g., "Greenfield Village") |
| `legal_name` | TEXT | NULL | Legal name for contracts |
| `subdomain` | TEXT | UNIQUE, NOT NULL | Subdomain for admin portal (e.g., "greenfield") |
| `community_type` | TEXT | CHECK IN ('HOA', 'Condo', 'Gated Village', 'Subdivision') | Type of community |
| `total_residences` | INTEGER | NOT NULL, DEFAULT 0 | Number of properties |
| `year_established` | INTEGER | NULL | Year the community was founded |
| `timezone` | TEXT | DEFAULT 'UTC' | Timezone (e.g., "Asia/Manila") |
| `language` | TEXT | DEFAULT 'en' | Language code (e.g., "en", "tl") |
| `logo_url` | TEXT | NULL | Supabase Storage URL for logo |
| `primary_color` | TEXT | DEFAULT '#000000' | Hex color for branding |
| `max_residences` | INTEGER | NOT NULL | Subscription limit |
| `max_admin_users` | INTEGER | NOT NULL | Subscription limit |
| `max_security_users` | INTEGER | NOT NULL | Subscription limit |
| `storage_quota_gb` | INTEGER | DEFAULT 10 | Storage quota in GB |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Tenant creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last updated timestamp |

**Indexes**: `subdomain`, `created_at`

**RLS**: No RLS (public table, but superadmin-only access via application logic)

---

### 2. Users & Authentication

#### `user_profiles`
Extends Supabase Auth users with additional metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, FK → auth.users(id) | User ID from Supabase Auth |
| `tenant_id` | UUID | FK → tenants(id), NOT NULL | Which tenant this user belongs to |
| `role` | TEXT | CHECK IN ('superadmin', 'admin_head', 'admin_officer', 'household_head', 'household_member', 'beneficial_user', 'security_head', 'security_officer') | User role |
| `first_name` | TEXT | NOT NULL | First name |
| `middle_name` | TEXT | NULL | Middle name |
| `last_name` | TEXT | NOT NULL | Last name |
| `phone_number` | TEXT | NULL | Mobile phone |
| `position` | TEXT | NULL | Position (e.g., "HOA President") |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Account creation |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last updated |

**Indexes**: `tenant_id`, `role`

**RLS**: Users can only see profiles in their tenant (via `tenant_id` match)

---

### 3. Property & Household Management

#### `properties`
Physical residences/addresses within a community.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Property ID |
| `tenant_id` | UUID | FK → tenants(id), NOT NULL | Tenant |
| `address` | TEXT | NOT NULL | Full address (e.g., "Block 5 Lot 12") |
| `phase` | TEXT | NULL | Phase/section (if applicable) |
| `block` | TEXT | NULL | Block number |
| `lot` | TEXT | NULL | Lot number |
| `unit` | TEXT | NULL | Unit number (condos) |
| `property_type` | TEXT | CHECK IN ('single_family', 'townhouse', 'condo', 'lot_only') | Property type |
| `property_size_sqm` | NUMERIC | NULL | Property size in square meters |
| `lot_size_sqm` | NUMERIC | NULL | Lot size (if applicable) |
| `bedrooms` | INTEGER | NULL | Number of bedrooms |
| `bathrooms` | INTEGER | NULL | Number of bathrooms |
| `parking_slots` | INTEGER | DEFAULT 0 | Parking slots |
| `status` | TEXT | DEFAULT 'vacant', CHECK IN ('vacant', 'occupied', 'under_construction', 'for_sale') | Property status |
| `gps_lat` | NUMERIC | NULL | GPS latitude |
| `gps_lng` | NUMERIC | NULL | GPS longitude |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

**Indexes**: `tenant_id`, `status`, `address`

**RLS**: Only accessible by users in the same tenant

---

#### `households`
Groups of residents assigned to a property.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Household ID |
| `tenant_id` | UUID | FK → tenants(id), NOT NULL | Tenant |
| `property_id` | UUID | FK → properties(id), NOT NULL | Assigned property |
| `household_head_id` | UUID | FK → user_profiles(id), NOT NULL | Household head user |
| `move_in_date` | DATE | NULL | Move-in date |
| `ownership_type` | TEXT | CHECK IN ('owner', 'renter') | Ownership status |
| `sticker_allocation` | INTEGER | DEFAULT 3 | Max vehicle stickers allowed |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

**Indexes**: `tenant_id`, `property_id`, `household_head_id`

**RLS**: Household head can access their own household, admins can access all households in tenant

---

#### `household_members`
Family members within a household.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Member ID |
| `tenant_id` | UUID | FK → tenants(id), NOT NULL | Tenant |
| `household_id` | UUID | FK → households(id), NOT NULL | Household |
| `user_id` | UUID | FK → user_profiles(id), NULL | User account (if adult member with app access) |
| `first_name` | TEXT | NOT NULL | First name |
| `last_name` | TEXT | NOT NULL | Last name |
| `relationship` | TEXT | CHECK IN ('spouse', 'child', 'parent', 'sibling', 'other') | Relationship to head |
| `age` | INTEGER | NULL | Age |
| `is_minor` | BOOLEAN | DEFAULT FALSE | Whether member is a minor |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

**Indexes**: `tenant_id`, `household_id`, `user_id`

**RLS**: Household members can view their household, admins can view all

---

#### `beneficial_users`
Non-residents with vehicle access (helpers, drivers).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Beneficial user ID |
| `tenant_id` | UUID | FK → tenants(id), NOT NULL | Tenant |
| `household_id` | UUID | FK → households(id), NOT NULL | Sponsoring household |
| `full_name` | TEXT | NOT NULL | Full name |
| `phone_number` | TEXT | NULL | Contact number |
| `government_id_url` | TEXT | NULL | Supabase Storage URL for ID |
| `reason` | TEXT | CHECK IN ('helper', 'driver', 'caregiver', 'family') | Access reason |
| `access_start_date` | DATE | NOT NULL | Access validity start |
| `access_end_date` | DATE | NOT NULL | Access validity end |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

**Indexes**: `tenant_id`, `household_id`

**RLS**: Household can manage their beneficial users, admins can view all

---

### 4. Access Control & Gate Management

#### `gates`
Physical entry/exit points in the community.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Gate ID |
| `tenant_id` | UUID | FK → tenants(id), NOT NULL | Tenant |
| `name` | TEXT | NOT NULL | Gate name (e.g., "Main Gate") |
| `gate_type` | TEXT | CHECK IN ('primary', 'secondary', 'service', 'emergency') | Gate type |
| `status` | TEXT | DEFAULT 'active', CHECK IN ('active', 'inactive', 'maintenance') | Operational status |
| `operating_hours_start` | TIME | NULL | Operating hours start (NULL = 24/7) |
| `operating_hours_end` | TIME | NULL | Operating hours end |
| `gps_lat` | NUMERIC | NULL | GPS latitude |
| `gps_lng` | NUMERIC | NULL | GPS longitude |
| `rfid_reader_serial` | TEXT | UNIQUE, NULL | RFID reader serial number |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

**Indexes**: `tenant_id`, `status`, `rfid_reader_serial`

**RLS**: All users in tenant can view gates, only admins and security can edit

---

#### `vehicle_stickers`
RFID/QR stickers for vehicle access.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Sticker ID |
| `tenant_id` | UUID | FK → tenants(id), NOT NULL | Tenant |
| `household_id` | UUID | FK → households(id), NULL | Household (if resident sticker) |
| `beneficial_user_id` | UUID | FK → beneficial_users(id), NULL | Beneficial user (if their sticker) |
| `rfid_serial` | TEXT | UNIQUE, NOT NULL | RFID sticker serial number |
| `vehicle_plate` | TEXT | NOT NULL | Vehicle plate number |
| `vehicle_make` | TEXT | NULL | Vehicle make/model |
| `vehicle_color` | TEXT | NULL | Vehicle color |
| `sticker_type` | TEXT | CHECK IN ('resident_permanent', 'beneficial_user', 'temporary_guest', 'contractor') | Sticker type |
| `status` | TEXT | DEFAULT 'pending', CHECK IN ('pending', 'approved', 'ready_for_pickup', 'issued', 'expired', 'lost', 'deactivated') | Sticker status |
| `issue_date` | DATE | NULL | Date issued |
| `expiry_date` | DATE | NULL | Expiration date |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Requested date |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

**Indexes**: `tenant_id`, `rfid_serial`, `household_id`, `status`, `vehicle_plate`

**RLS**: Household can view their stickers, admins can manage all stickers

---

#### `entry_exit_logs`
Record of all gate entries and exits.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Log entry ID |
| `tenant_id` | UUID | FK → tenants(id), NOT NULL | Tenant |
| `gate_id` | UUID | FK → gates(id), NOT NULL | Gate used |
| `sticker_id` | UUID | FK → vehicle_stickers(id), NULL | Sticker scanned (if applicable) |
| `guest_id` | UUID | FK → guests(id), NULL | Guest (if guest entry) |
| `entry_type` | TEXT | CHECK IN ('resident', 'guest', 'delivery', 'construction_worker', 'emergency') | Entry type |
| `direction` | TEXT | CHECK IN ('entry', 'exit') | Entry or exit |
| `timestamp` | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | Entry/exit time |
| `guard_on_duty_id` | UUID | FK → user_profiles(id), NULL | Security officer |
| `vehicle_plate` | TEXT | NULL | Vehicle plate (manual or OCR) |
| `notes` | TEXT | NULL | Additional notes |

**Indexes**: `tenant_id`, `gate_id`, `timestamp`, `entry_type`

**RLS**: Security and admins can view logs, households can view their own entries

---

#### `guests`
Pre-registered or walk-in guests.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Guest ID |
| `tenant_id` | UUID | FK → tenants(id), NOT NULL | Tenant |
| `household_id` | UUID | FK → households(id), NOT NULL | Host household |
| `guest_name` | TEXT | NOT NULL | Guest name |
| `phone_number` | TEXT | NULL | Contact number |
| `vehicle_plate` | TEXT | NULL | Vehicle plate |
| `visit_type` | TEXT | CHECK IN ('day_trip', 'multi_day') | Visit type |
| `visit_date` | DATE | NOT NULL | Expected visit date |
| `expected_arrival_time` | TIME | NULL | Expected arrival |
| `actual_arrival_time` | TIMESTAMPTZ | NULL | Actual arrival (from entry log) |
| `checkout_date` | DATE | NULL | For multi-day stays |
| `actual_departure_time` | TIMESTAMPTZ | NULL | Actual departure (from exit log) |
| `status` | TEXT | DEFAULT 'pre_registered', CHECK IN ('pre_registered', 'arrived', 'departed', 'overstayed', 'rejected') | Guest status |
| `approved_by_household` | BOOLEAN | DEFAULT FALSE | Household approval |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Pre-registration time |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

**Indexes**: `tenant_id`, `household_id`, `visit_date`, `status`

**RLS**: Household can manage their guests, security and admins can view all

---

### 5. Construction & Permits

#### `construction_permits`
Permits for construction/renovation work.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Permit ID |
| `tenant_id` | UUID | FK → tenants(id), NOT NULL | Tenant |
| `household_id` | UUID | FK → households(id), NOT NULL | Requesting household |
| `project_type` | TEXT | CHECK IN ('renovation', 'addition', 'repair', 'landscaping') | Project type |
| `description` | TEXT | NOT NULL | Project description |
| `start_date` | DATE | NOT NULL | Planned start date |
| `duration_days` | INTEGER | NOT NULL | Estimated duration |
| `contractor_name` | TEXT | NULL | Contractor name |
| `contractor_license_url` | TEXT | NULL | License document URL |
| `num_workers` | INTEGER | DEFAULT 1 | Number of workers |
| `materials_description` | TEXT | NULL | Materials list |
| `road_fee_amount` | NUMERIC | DEFAULT 0 | Calculated road fee |
| `payment_status` | TEXT | DEFAULT 'pending', CHECK IN ('pending', 'paid', 'refunded') | Payment status |
| `permit_status` | TEXT | DEFAULT 'pending_approval', CHECK IN ('pending_approval', 'approved', 'active', 'on_hold', 'completed', 'rejected') | Permit status |
| `approved_by_admin_id` | UUID | FK → user_profiles(id), NULL | Approving admin |
| `approved_at` | TIMESTAMPTZ | NULL | Approval timestamp |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Request date |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

**Indexes**: `tenant_id`, `household_id`, `permit_status`, `start_date`

**RLS**: Household can view their permits, admins can manage all permits

---

#### `construction_workers`
Registered workers for active permits.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Worker ID |
| `tenant_id` | UUID | FK → tenants(id), NOT NULL | Tenant |
| `permit_id` | UUID | FK → construction_permits(id), NOT NULL | Associated permit |
| `full_name` | TEXT | NOT NULL | Worker name |
| `government_id_number` | TEXT | NULL | ID number |
| `photo_url` | TEXT | NULL | Photo URL (from first entry) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Registered date |

**Indexes**: `tenant_id`, `permit_id`

**RLS**: Household and admins can view workers for their permits

---

### 6. Communication

#### `announcements`
Announcements from admin to residents/security.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Announcement ID |
| `tenant_id` | UUID | FK → tenants(id), NOT NULL | Tenant |
| `created_by_admin_id` | UUID | FK → user_profiles(id), NOT NULL | Creator admin |
| `title` | TEXT | NOT NULL | Title |
| `content` | TEXT | NOT NULL | Content (supports markdown/rich text) |
| `urgency` | TEXT | CHECK IN ('critical', 'important', 'info') | Urgency level |
| `category` | TEXT | CHECK IN ('event', 'maintenance', 'security', 'policy') | Category |
| `target_audience` | TEXT | CHECK IN ('all_residents', 'all_security', 'specific_households', 'all') | Audience |
| `specific_household_ids` | UUID[] | NULL | If target is specific households |
| `effective_start` | TIMESTAMPTZ | DEFAULT NOW() | When to show |
| `effective_end` | TIMESTAMPTZ | NULL | When to hide (NULL = permanent) |
| `requires_acknowledgment` | BOOLEAN | DEFAULT FALSE | Require read receipt |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

**Indexes**: `tenant_id`, `created_at`, `urgency`, `target_audience`

**RLS**: Admins can create, residents and security can view announcements targeted to them

---

#### `announcement_acknowledgments`
Tracks who has read/acknowledged announcements.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Ack ID |
| `announcement_id` | UUID | FK → announcements(id), NOT NULL | Announcement |
| `user_id` | UUID | FK → user_profiles(id), NOT NULL | User who acknowledged |
| `acknowledged_at` | TIMESTAMPTZ | DEFAULT NOW() | Acknowledgment time |

**Indexes**: `announcement_id`, `user_id`

**RLS**: Users can create their own acknowledgments, admins can view all

---

### 7. Security & Incidents

#### `incidents`
Security incident reports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Incident ID |
| `tenant_id` | UUID | FK → tenants(id), NOT NULL | Tenant |
| `reported_by_security_id` | UUID | FK → user_profiles(id), NOT NULL | Reporting security officer |
| `incident_type` | TEXT | CHECK IN ('suspicious_person', 'theft', 'vandalism', 'noise_complaint', 'medical_emergency', 'fire', 'other') | Type |
| `location_gate_id` | UUID | FK → gates(id), NULL | Gate location (if applicable) |
| `location_property_id` | UUID | FK → properties(id), NULL | Property location (if applicable) |
| `description` | TEXT | NOT NULL | Incident description |
| `severity` | TEXT | CHECK IN ('low', 'medium', 'high', 'critical') | Severity |
| `evidence_photo_urls` | TEXT[] | NULL | Array of Supabase Storage URLs |
| `status` | TEXT | DEFAULT 'reported', CHECK IN ('reported', 'responding', 'resolved') | Status |
| `resolved_by_admin_id` | UUID | FK → user_profiles(id), NULL | Resolving admin |
| `resolution_notes` | TEXT | NULL | Resolution notes |
| `resolved_at` | TIMESTAMPTZ | NULL | Resolution time |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Report time |

**Indexes**: `tenant_id`, `severity`, `status`, `created_at`

**RLS**: Security can create, admins can view and resolve, affected households can view incidents at their property

---

### 8. Financials

#### `association_fees`
HOA fees owed by households.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Fee ID |
| `tenant_id` | UUID | FK → tenants(id), NOT NULL | Tenant |
| `household_id` | UUID | FK → households(id), NOT NULL | Household |
| `fee_type` | TEXT | CHECK IN ('monthly', 'annual', 'special_assessment') | Fee type |
| `amount` | NUMERIC | NOT NULL | Fee amount |
| `due_date` | DATE | NOT NULL | Due date |
| `payment_status` | TEXT | DEFAULT 'unpaid', CHECK IN ('unpaid', 'paid', 'overdue') | Payment status |
| `paid_at` | TIMESTAMPTZ | NULL | Payment timestamp |
| `payment_method` | TEXT | NULL | Payment method (e.g., "Stripe", "Bank Transfer") |
| `receipt_url` | TEXT | NULL | Receipt URL |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Invoice generated |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

**Indexes**: `tenant_id`, `household_id`, `due_date`, `payment_status`

**RLS**: Household can view their fees, admins can manage all

---

## Triggers & Functions

### Auto-Update `updated_at`
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- (repeat for all tables)
```

### Audit Logging
```sql
-- Trigger to log sensitive actions (permit approvals, fee waivers)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## RLS Policy Examples

### Tenant Isolation (applied to all tenant-scoped tables)
```sql
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON households
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );
```

### Role-Based Access
```sql
CREATE POLICY admin_full_access ON households
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin_head', 'admin_officer')
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY household_own_access ON households
  FOR SELECT USING (
    household_head_id = auth.uid()
  );
```

---

## Data Validation Rules

1. **Unique Constraints**: `tenants.subdomain`, `vehicle_stickers.rfid_serial`, `gates.rfid_reader_serial`
2. **Check Constraints**: All `status`, `type`, `role` columns use CHECK IN (...) for valid values
3. **Foreign Keys**: All references include ON DELETE CASCADE or RESTRICT based on business rules
4. **Timestamps**: All tables have `created_at` and `updated_at` with triggers

---

## Next Steps

- Generate SQL migration files in `supabase/migrations/`
- Define API contracts in `contracts/` for CRUD operations
- Create TypeScript types from this schema (use Supabase CLI: `supabase gen types typescript`)
- Document quickstart guide in `quickstart.md`
