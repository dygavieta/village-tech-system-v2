# API Contracts - Residential Community Management Platform

**Feature**: 001-residential-community-management
**Date**: 2025-10-10

## Overview

API contracts define the interfaces between client applications (Platform, Admin, Residence, Sentinel) and the Supabase backend. All endpoints use Supabase's built-in REST API with Row-Level Security (RLS) for authorization.

## Contract Organization

### Supabase REST API Pattern
All CRUD operations follow Supabase's auto-generated REST API:
- **GET** `/rest/v1/{table}?{filters}` - Read records
- **POST** `/rest/v1/{table}` - Create record
- **PATCH** `/rest/v1/{table}?{filters}` - Update record
- **DELETE** `/rest/v1/{table}?{filters}` - Delete record

### Edge Functions (Custom Business Logic)
For complex workflows not suitable for direct table access:

| Endpoint | Method | Description | Used By |
|----------|--------|-------------|---------|
| `/functions/v1/create-tenant` | POST | Provision new tenant with schema, admin, properties | Platform app |
| `/functions/v1/approve-sticker` | POST | Approve sticker request, send notification, update status | Admin app |
| `/functions/v1/approve-permit` | POST | Approve construction permit, calculate fee, generate invoice | Admin app |
| `/functions/v1/request-guest-approval` | POST | Send real-time approval request to household | Sentinel app |
| `/functions/v1/sync-offline-logs` | POST | Batch sync offline entry logs from Sentinel app | Sentinel app |
| `/functions/v1/send-announcement` | POST | Create announcement and push notifications to recipients | Admin app |
| `/functions/v1/stripe-webhook` | POST | Handle Stripe payment confirmations | Stripe |

## Authentication

All requests include:
```
Authorization: Bearer {JWT_TOKEN}
```

JWT contains custom claims:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "tenant_id": "tenant-uuid",
  "role": "admin_head"
}
```

## Sample Contracts

### 1. Tenant Creation (Platform App)

**Endpoint**: `POST /functions/v1/create-tenant`

**Request Body**:
```json
{
  "name": "Greenfield Village",
  "legal_name": "Greenfield HOA Inc.",
  "subdomain": "greenfield",
  "community_type": "HOA",
  "total_residences": 150,
  "admin_email": "admin@greenfield.com",
  "admin_name": "John Smith",
  "properties": [
    { "address": "Block 1 Lot 1", "property_type": "single_family" },
    { "address": "Block 1 Lot 2", "property_type": "single_family" }
  ],
  "gates": [
    { "name": "Main Gate", "gate_type": "primary", "rfid_reader_serial": "RFID-001" }
  ]
}
```

**Response** (201 Created):
```json
{
  "tenant_id": "uuid",
  "subdomain": "greenfield",
  "admin_user_id": "uuid",
  "properties_created": 2,
  "gates_created": 1,
  "activation_email_sent": true
}
```

---

### 2. Household Creation (Admin App)

**Endpoint**: `POST /rest/v1/households`

**Request Body**:
```json
{
  "property_id": "property-uuid",
  "household_head_email": "resident@email.com",
  "household_head_name": "Jane Doe",
  "household_head_phone": "+63912345678",
  "move_in_date": "2025-01-15",
  "ownership_type": "owner"
}
```

**Response** (201 Created):
```json
{
  "id": "household-uuid",
  "household_head_id": "user-uuid",
  "credentials_sent": true
}
```

---

### 3. Sticker Request (Residence App)

**Endpoint**: `POST /rest/v1/vehicle_stickers`

**Request Body**:
```json
{
  "household_id": "household-uuid",
  "vehicle_plate": "ABC-1234",
  "vehicle_make": "Toyota Vios",
  "vehicle_color": "White",
  "sticker_type": "resident_permanent",
  "or_cr_document_url": "https://storage.supabase.co/..."
}
```

**Response** (201 Created):
```json
{
  "id": "sticker-uuid",
  "status": "pending",
  "created_at": "2025-10-10T10:30:00Z"
}
```

---

### 4. Guest Pre-Registration (Residence App)

**Endpoint**: `POST /rest/v1/guests`

**Request Body**:
```json
{
  "household_id": "household-uuid",
  "guest_name": "Mark Johnson",
  "phone_number": "+63918765432",
  "vehicle_plate": "XYZ-5678",
  "visit_type": "day_trip",
  "visit_date": "2025-10-15",
  "expected_arrival_time": "14:00:00"
}
```

**Response** (201 Created):
```json
{
  "id": "guest-uuid",
  "status": "pre_registered",
  "approved_by_household": true
}
```

---

### 5. Guest Check-In (Sentinel App)

**Endpoint**: `POST /rest/v1/entry_exit_logs`

**Request Body**:
```json
{
  "gate_id": "gate-uuid",
  "guest_id": "guest-uuid",
  "entry_type": "guest",
  "direction": "entry",
  "guard_on_duty_id": "security-officer-uuid",
  "vehicle_plate": "XYZ-5678"
}
```

**Response** (201 Created):
```json
{
  "id": "log-uuid",
  "timestamp": "2025-10-15T14:05:00Z",
  "guest_status_updated": "arrived"
}
```

---

### 6. Construction Permit Request (Residence App)

**Endpoint**: `POST /rest/v1/construction_permits`

**Request Body**:
```json
{
  "household_id": "household-uuid",
  "project_type": "renovation",
  "description": "Kitchen renovation",
  "start_date": "2025-11-01",
  "duration_days": 30,
  "contractor_name": "ABC Construction",
  "num_workers": 5,
  "contractor_license_url": "https://storage.supabase.co/..."
}
```

**Response** (201 Created):
```json
{
  "id": "permit-uuid",
  "permit_status": "pending_approval",
  "road_fee_amount": null
}
```

---

### 7. Approve Permit & Calculate Fee (Admin App)

**Endpoint**: `POST /functions/v1/approve-permit`

**Request Body**:
```json
{
  "permit_id": "permit-uuid",
  "road_fee_amount": 5000,
  "approved_by_admin_id": "admin-uuid"
}
```

**Response** (200 OK):
```json
{
  "permit_id": "permit-uuid",
  "permit_status": "approved",
  "road_fee_amount": 5000,
  "invoice_generated": true,
  "notification_sent": true
}
```

---

### 8. Real-Time Guest Approval Request (Sentinel App)

**Endpoint**: `POST /functions/v1/request-guest-approval`

**Request Body**:
```json
{
  "household_id": "household-uuid",
  "guest_name": "Walk-in Visitor",
  "vehicle_plate": "DEF-9999",
  "gate_id": "gate-uuid"
}
```

**Response** (202 Accepted):
```json
{
  "approval_request_id": "uuid",
  "status": "pending",
  "timeout_seconds": 120,
  "notification_sent": true
}
```

**Real-Time Response** (via Supabase Realtime):
Household receives push notification and responds via Residence app. Sentinel app subscribes to `approval_requests` table for real-time updates.

---

### 9. Announcement Creation (Admin App)

**Endpoint**: `POST /functions/v1/send-announcement`

**Request Body**:
```json
{
  "title": "Pool Maintenance Notice",
  "content": "The community pool will be closed for maintenance...",
  "urgency": "important",
  "category": "maintenance",
  "target_audience": "all_residents",
  "effective_start": "2025-10-16T09:00:00Z",
  "effective_end": "2025-10-20T18:00:00Z",
  "requires_acknowledgment": false
}
```

**Response** (201 Created):
```json
{
  "announcement_id": "uuid",
  "recipients_count": 150,
  "notifications_sent": 150
}
```

---

## Error Responses

All endpoints return standard HTTP status codes:

**400 Bad Request**:
```json
{
  "error": "validation_error",
  "message": "Invalid vehicle plate format",
  "details": { "field": "vehicle_plate", "expected": "XXX-1234" }
}
```

**401 Unauthorized**:
```json
{
  "error": "unauthorized",
  "message": "Invalid or expired JWT token"
}
```

**403 Forbidden**:
```json
{
  "error": "forbidden",
  "message": "Insufficient permissions for this resource"
}
```

**404 Not Found**:
```json
{
  "error": "not_found",
  "message": "Household not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "server_error",
  "message": "An unexpected error occurred"
}
```

---

## Realtime Subscriptions

Clients subscribe to Supabase Realtime channels for live updates:

### Admin App Subscriptions
- `announcements` - New announcements
- `vehicle_stickers` - New sticker requests
- `construction_permits` - New permit requests
- `incidents` - New incident reports

### Residence App Subscriptions
- `announcements` (filtered by `target_audience`)
- `guests` (filtered by `household_id`) - Guest arrival/departure notifications
- `vehicle_stickers` (filtered by `household_id`) - Sticker approval updates

### Sentinel App Subscriptions
- `guest_entry_requests` - Real-time approval requests
- `construction_permits` - Active permits for worker verification
- `incidents` (filtered by `gate_id`) - Incident alerts

---

## Rate Limiting

Supabase Edge Functions enforce rate limits:
- **100 requests/minute** per user (unauthenticated)
- **1000 requests/minute** per authenticated user
- **10,000 requests/minute** per tenant (admin users)

---

## Next Steps

1. Implement Edge Functions in `supabase/functions/`
2. Generate TypeScript types from database schema
3. Create client SDK wrappers for common operations
4. Document authentication flows in quickstart.md
