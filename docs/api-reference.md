# API Reference - Edge Functions

**Last Updated**: 2025-10-15
**Base URL**: `https://your-project.supabase.co/functions/v1`

## Overview

Village Tech System V2 uses Supabase Edge Functions (Deno runtime) for backend logic that requires complex operations, external integrations, or elevated permissions. All Edge Functions are stateless, RESTful, and protected by authentication.

## Authentication

All endpoints (except webhooks) require a valid Supabase Auth JWT token in the `Authorization` header:

```http
Authorization: Bearer <supabase-jwt-token>
```

The JWT token must contain:
- `sub`: User ID (UUID)
- `tenant_id`: Tenant ID for RLS enforcement
- `role`: User role for permission checking

## Common Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate subdomain) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error (check logs) |

## Error Response Format

All error responses follow this structure:

```json
{
  "error": "Error message",
  "details": "Additional context (optional)",
  "code": "ERROR_CODE"
}
```

---

## 1. Create Tenant

**Endpoint**: `POST /create-tenant`
**Description**: Provisions a new residential community with properties, gates, and admin user
**Permissions**: Superadmin only
**User Story**: US1

### Request Body

```json
{
  "name": "Greenfield Village HOA",
  "legal_name": "Greenfield Village Homeowners Association Inc.",
  "subdomain": "greenfield",
  "community_type": "HOA",
  "year_established": 2020,
  "max_residences": 500,
  "max_admin_users": 10,
  "max_security_users": 20,
  "storage_quota_gb": 50,
  "properties": [
    {
      "address": "Block 1 Lot 1",
      "phase": "1",
      "block": "1",
      "lot": "1",
      "property_type": "single_family",
      "property_size_sqm": 150,
      "lot_size_sqm": 200,
      "bedrooms": 3,
      "bathrooms": 2,
      "parking_slots": 2
    }
  ],
  "gates": [
    {
      "name": "Main Gate",
      "gate_type": "primary",
      "operating_hours_start": "06:00",
      "operating_hours_end": "22:00",
      "rfid_reader_serial": "RFID-001"
    }
  ],
  "admin_user": {
    "email": "admin@greenfield.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+63 912 345 6789",
    "position": "HOA President"
  }
}
```

### Response (201 Created)

```json
{
  "tenant_id": "uuid",
  "subdomain": "greenfield",
  "admin_portal_url": "https://greenfield.admin.villagetech.app",
  "admin_user_id": "uuid",
  "properties_created": 1,
  "gates_created": 1,
  "activation_email_sent": true
}
```

### Validation Rules
- `subdomain`: 3-63 chars, alphanumeric + hyphens, must be unique
- `max_residences`: 1-10,000
- `properties`: Max 1,000 per request
- `gates`: Max 20 per tenant
- `admin_user.email`: Must be valid and unique

---

## 2. Approve Sticker

**Endpoint**: `POST /approve-sticker`
**Description**: Approves or rejects a vehicle sticker request
**Permissions**: Admin (admin_head, admin_officer)
**User Story**: US2

### Request Body

```json
{
  "sticker_id": "uuid",
  "action": "approve",
  "rfid_serial": "RFID-V-12345",
  "notes": "Approved - OR/CR verified"
}
```

**Actions**: `approve`, `reject`

### Response (200 OK)

```json
{
  "sticker_id": "uuid",
  "status": "approved",
  "rfid_serial": "RFID-V-12345",
  "expiry_date": "2026-10-15",
  "household_notified": true
}
```

### Business Logic
- Checks household sticker allocation limit
- Generates unique RFID serial if not provided
- Sets expiry date (1 year from approval)
- Sends push notification to household
- Updates status to `approved` or `rejected`

---

## 3. Approve Permit

**Endpoint**: `POST /approve-permit`
**Description**: Approves a construction permit and calculates road fees
**Permissions**: Admin (admin_head, admin_officer)
**User Story**: US3

### Request Body

```json
{
  "permit_id": "uuid",
  "action": "approve",
  "road_fee_amount": 5000.00,
  "notes": "Approved for 30 days"
}
```

**Actions**: `approve`, `reject`, `hold`

### Response (200 OK)

```json
{
  "permit_id": "uuid",
  "permit_status": "approved",
  "road_fee_amount": 5000.00,
  "invoice_url": "https://...storage.../invoice.pdf",
  "payment_link": "https://checkout.stripe.com/...",
  "household_notified": true
}
```

### Business Logic
- Calculates road fee based on project type and duration
- Generates Stripe invoice
- Updates permit status to `approved`
- Sends notification with payment link
- Records admin who approved

---

## 4. Request Guest Approval

**Endpoint**: `POST /request-guest-approval`
**Description**: Requests real-time approval from household for walk-in visitor
**Permissions**: Security officer
**User Story**: US4

### Request Body

```json
{
  "household_id": "uuid",
  "guest_name": "Jane Smith",
  "vehicle_plate": "ABC 1234",
  "gate_id": "uuid",
  "purpose": "Visiting friend",
  "timeout_seconds": 120
}
```

### Response (201 Created)

```json
{
  "approval_request_id": "uuid",
  "status": "pending",
  "timeout_at": "2025-10-15T10:32:00Z",
  "household_notified": true
}
```

### Real-time Flow
1. Creates `guest_approval_requests` record
2. Sends push notification to household via FCM
3. Subscribes to `guest_approval_requests` channel
4. Household responds within 2 minutes via Residence app
5. Security officer sees response in real-time
6. After timeout or response, status updates to `approved`, `rejected`, or `timeout`

### Polling Alternative

If real-time doesn't work, poll this endpoint:

```http
GET /request-guest-approval/{approval_request_id}
```

Response:
```json
{
  "approval_request_id": "uuid",
  "status": "approved",
  "responded_at": "2025-10-15T10:30:45Z",
  "response_note": "Approved by household head"
}
```

---

## 5. Sync Offline Logs

**Endpoint**: `POST /sync-offline-logs`
**Description**: Syncs entry/exit logs from Sentinel app when back online
**Permissions**: Security officer
**User Story**: US4

### Request Body

```json
{
  "logs": [
    {
      "local_id": "temp-uuid-1",
      "gate_id": "uuid",
      "sticker_id": "uuid",
      "entry_type": "resident",
      "direction": "entry",
      "timestamp": "2025-10-15T08:30:00Z",
      "vehicle_plate": "XYZ 7890"
    },
    {
      "local_id": "temp-uuid-2",
      "gate_id": "uuid",
      "sticker_id": "uuid",
      "entry_type": "resident",
      "direction": "exit",
      "timestamp": "2025-10-15T18:45:00Z",
      "vehicle_plate": "XYZ 7890"
    }
  ]
}
```

### Response (200 OK)

```json
{
  "total_logs": 2,
  "synced": 2,
  "duplicates": 0,
  "errors": [],
  "sync_status": {
    "temp-uuid-1": {
      "status": "success",
      "server_id": "uuid"
    },
    "temp-uuid-2": {
      "status": "success",
      "server_id": "uuid"
    }
  }
}
```

### Business Logic
- Deduplicates based on timestamp + gate + sticker
- Validates sticker exists and is active
- Inserts logs in batch (max 1000 per request)
- Returns mapping of local IDs to server IDs
- Handles conflicts gracefully

---

## 6. Send Announcement

**Endpoint**: `POST /send-announcement`
**Description**: Creates announcement and sends notifications to target audience
**Permissions**: Admin (admin_head, admin_officer)
**User Story**: US5

### Request Body

```json
{
  "title": "Community Cleanup Drive",
  "content": "Join us this Saturday for a community cleanup...",
  "urgency": "important",
  "category": "event",
  "target_audience": "all_residents",
  "specific_household_ids": null,
  "effective_start": "2025-10-15T00:00:00Z",
  "effective_end": "2025-10-22T23:59:59Z",
  "requires_acknowledgment": false,
  "attachment_urls": [
    "https://...storage.../flyer.pdf"
  ]
}
```

**Urgency**: `critical`, `important`, `info`
**Category**: `event`, `maintenance`, `security`, `policy`
**Target Audience**: `all_residents`, `all_security`, `specific_households`, `all`

### Response (201 Created)

```json
{
  "announcement_id": "uuid",
  "recipients_count": 450,
  "push_notifications_sent": 450,
  "emails_sent": 45,
  "sms_sent": 0
}
```

### Notification Logic
- **Critical**: Push + Email + SMS
- **Important**: Push + Email
- **Info**: Push only

---

## 7. Send Payment Reminder

**Endpoint**: `POST /send-payment-reminder`
**Description**: Sends reminder for overdue association fees (called by pg_cron)
**Permissions**: System (service role key)
**User Story**: US5

### Request Body

```json
{
  "fee_id": "uuid"
}
```

### Response (200 OK)

```json
{
  "fee_id": "uuid",
  "household_id": "uuid",
  "amount": 5000.00,
  "days_overdue": 7,
  "reminder_sent": true,
  "late_fee_applied": 100.00
}
```

### Scheduling

Configured in `supabase/migrations/00021_setup_payment_reminder_cron.sql`:

```sql
SELECT cron.schedule(
  'send-payment-reminders',
  '0 9 * * *',  -- Daily at 9 AM
  $$
  SELECT http_request(
    'POST',
    'https://your-project.supabase.co/functions/v1/send-payment-reminder',
    '{"fee_id": "' || id || '"}',
    'application/json',
    jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  )
  FROM association_fees
  WHERE payment_status = 'overdue'
    AND due_date < CURRENT_DATE - INTERVAL '7 days';
  $$
);
```

---

## 8. Enforce Rule Acknowledgment

**Endpoint**: `POST /enforce-rule-acknowledgment`
**Description**: Sends notifications for unacknowledged critical rules
**Permissions**: System (service role key) or Admin
**User Story**: US5

### Request Body

```json
{
  "rule_id": "uuid"
}
```

### Response (200 OK)

```json
{
  "rule_id": "uuid",
  "rule_title": "New Parking Rules",
  "total_residents": 500,
  "acknowledged": 320,
  "pending": 180,
  "reminders_sent": 180
}
```

---

## 9. Stripe Webhook

**Endpoint**: `POST /stripe-webhook`
**Description**: Handles Stripe payment events (invoice paid, payment failed)
**Permissions**: Webhook signature validation
**User Story**: US3, US5

### Headers

```http
Stripe-Signature: t=...,v1=...
```

### Request Body (Stripe Event)

```json
{
  "id": "evt_...",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_...",
      "amount": 500000,
      "currency": "php",
      "metadata": {
        "fee_id": "uuid"
      }
    }
  }
}
```

### Response (200 OK)

```json
{
  "received": true
}
```

### Supported Events
- `payment_intent.succeeded` → Mark fee as paid, generate receipt
- `payment_intent.payment_failed` → Send failure notification
- `invoice.paid` → Update association fee status

---

## 10. Create Household User

**Endpoint**: `POST /create-household-user`
**Description**: Creates user account for household head with credentials
**Permissions**: Admin (admin_head, admin_officer)
**User Story**: US2

### Request Body

```json
{
  "household_id": "uuid",
  "email": "resident@example.com",
  "first_name": "Maria",
  "last_name": "Santos",
  "phone_number": "+63 917 123 4567",
  "send_welcome_email": true
}
```

### Response (201 Created)

```json
{
  "user_id": "uuid",
  "household_id": "uuid",
  "email": "resident@example.com",
  "temporary_password": "SecurePass123!",
  "welcome_email_sent": true,
  "residence_app_link": "https://play.google.com/store/apps/residence"
}
```

### Business Logic
- Creates user in `auth.users` table
- Creates profile in `user_profiles` with role `household_head`
- Links user to household
- Generates secure temporary password
- Sends welcome email with instructions
- Forces password change on first login

---

## Rate Limiting

All endpoints are rate-limited per user:

| Endpoint | Limit |
|----------|-------|
| `create-tenant` | 10 requests/hour |
| `approve-sticker` | 100 requests/hour |
| `approve-permit` | 50 requests/hour |
| `request-guest-approval` | 200 requests/hour |
| `sync-offline-logs` | 10 requests/minute |
| `send-announcement` | 20 requests/hour |
| Other endpoints | 100 requests/hour |

Rate limit headers included in response:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1697395200
```

---

## Testing with cURL

### Create Tenant (Superadmin)

```bash
curl -X POST https://your-project.supabase.co/functions/v1/create-tenant \
  -H "Authorization: Bearer YOUR_SUPERADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Village",
    "subdomain": "test-village",
    "community_type": "HOA",
    "max_residences": 100,
    "properties": [],
    "gates": [],
    "admin_user": {
      "email": "admin@test.com",
      "first_name": "Admin",
      "last_name": "User"
    }
  }'
```

### Approve Sticker (Admin)

```bash
curl -X POST https://your-project.supabase.co/functions/v1/approve-sticker \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "sticker_id": "UUID_HERE",
    "action": "approve",
    "rfid_serial": "RFID-V-001"
  }'
```

---

## Best Practices

1. **Always include tenant_id in JWT**: RLS policies depend on it
2. **Use HTTPS only**: Never send JWT over HTTP
3. **Implement retry logic**: Use exponential backoff for failed requests
4. **Handle rate limits**: Respect `X-RateLimit-*` headers
5. **Validate webhooks**: Always verify Stripe webhook signatures
6. **Log errors**: Send error details to monitoring (Sentry)
7. **Test offline sync**: Ensure `sync-offline-logs` handles duplicates

---

## Support

For API issues or questions:
- **Internal**: Contact backend team
- **Logs**: Check Supabase Edge Function logs in dashboard
- **Monitoring**: Use Supabase Insights for query performance

**Last Updated**: 2025-10-15
**Version**: 2.0.0
