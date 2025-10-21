# Supabase Edge Functions

This directory contains Edge Functions for the Village Tech residential community management platform.

## Overview

Edge Functions are serverless functions that run on Deno runtime, deployed at the edge for low-latency execution. They handle business logic that requires elevated privileges or integrates with external services.

## Shared Utilities

Located in `_shared/` directory:

- **logger.ts** - Structured logging with JSON format and context support
- **supabase-client.ts** - Supabase client creation utilities (service role and anon)
- **cors.ts** - CORS headers and response helpers
- **email.ts** - Email service integration (Resend) with templates
- **email-templates.ts** - Existing email templates for tenant/household setup
- **notification.ts** - Push notification (FCM) and SMS (Twilio) services
- **subdomain-validator.ts** - Subdomain validation utilities

## Edge Functions

### 1. send-announcement (T143)

**Purpose:** Creates announcements and sends notifications to target audience.

**Endpoint:** `POST /send-announcement`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "title": "Community Pool Maintenance",
  "content": "The community pool will be closed for maintenance...",
  "urgency": "critical|important|info",
  "category": "event|maintenance|security|policy|general",
  "target_audience": "all_residents|all_security|specific_households|all",
  "specific_household_ids": ["uuid1", "uuid2"],
  "effective_start": "2025-10-15T00:00:00Z",
  "effective_end": "2025-10-20T00:00:00Z",
  "requires_acknowledgment": true,
  "attachment_urls": ["https://..."]
}
```

**Response:**
```json
{
  "success": true,
  "announcement_id": "uuid",
  "recipients_count": 150,
  "notifications": {
    "emails_sent": 120,
    "push_notifications_sent": 130
  },
  "message": "Announcement created and notifications sent successfully"
}
```

**Features:**
- Validates admin authentication
- Inserts announcement into database
- Filters recipients based on target_audience
- Sends push notifications for critical announcements
- Sends emails for important/critical announcements
- Supports specific household targeting

**Database Tables:**
- `announcements` - Stores announcement data
- `households` - For recipient lookup
- `user_profiles` - For recipient contact info

---

### 2. stripe-webhook (T144)

**Purpose:** Handles Stripe webhook events for payment processing.

**Endpoint:** `POST /stripe-webhook`

**Authentication:** Stripe signature verification

**Webhook Events Handled:**
- `payment_intent.succeeded` - Updates fee status to paid

**Request:** Stripe webhook payload with signature header

**Response:**
```json
{
  "received": true,
  "payment_intent_id": "pi_xxx",
  "fee_id": "uuid",
  "message": "Payment processed successfully"
}
```

**Features:**
- Verifies Stripe webhook signature (HMAC SHA256)
- Updates association_fees payment_status to 'paid'
- Records payment method and timestamp
- Generates receipt URL (Stripe dashboard link)
- Sends confirmation email to household head with receipt
- Handles payment metadata (fee_id, household_id, tenant_id)

**Database Tables:**
- `association_fees` - Updates payment status
- `households` - For household lookup
- `tenants` - For branding info

**Environment Variables Required:**
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret

---

### 3. enforce-rule-acknowledgment (T151d)

**Purpose:** Enforces rule acknowledgment by sending notifications to residents who haven't acknowledged.

**Endpoint:** `POST /enforce-rule-acknowledgment`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "rule_id": "uuid",
  "criticality": "high|medium|low",
  "deadline": "2025-10-30",
  "escalate_to_admin": true
}
```

**Response:**
```json
{
  "success": true,
  "rule_id": "uuid",
  "rule_title": "Parking Regulations",
  "acknowledgment_stats": {
    "total_residents": 200,
    "acknowledged": 150,
    "pending": 50,
    "acknowledgment_rate": 75
  },
  "notifications_sent": {
    "emails": 50,
    "push_notifications": 50,
    "sms": 10
  },
  "escalated_to_admin": true,
  "message": "Rule acknowledgment enforcement completed"
}
```

**Features:**
- Validates rule requires acknowledgment
- Identifies residents who haven't acknowledged
- Sends notifications based on criticality:
  - **High:** Email + Push + SMS
  - **Medium:** Email + Push
  - **Low:** Email only
- Tracks acknowledgment status
- Escalates to admin with non-compliance report
- Prevents notification spam (checks acknowledgment first)

**Database Tables:**
- `village_rules` - Rule details
- `rule_acknowledgments` - Tracks who acknowledged
- `households` - For resident lookup
- `user_profiles` - For contact info

---

### 4. send-payment-reminder (T154c)

**Purpose:** Sends payment reminders for overdue or upcoming association fees.

**Endpoint:** `POST /send-payment-reminder`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "fee_id": "uuid",
  "batch_mode": true,
  "days_before_due": 7,
  "include_sms": true
}
```

**Response:**
```json
{
  "success": true,
  "reminder_sent_count": 45,
  "notifications": {
    "emails_sent": 45,
    "sms_sent": 12
  },
  "fees_processed": [
    {
      "fee_id": "uuid",
      "household_id": "uuid",
      "amount": 1500.00,
      "due_date": "2025-10-15",
      "payment_status": "overdue"
    }
  ],
  "message": "Payment reminders sent successfully"
}
```

**Features:**
- **Single mode:** Remind about specific fee_id
- **Batch mode:** Process all overdue/upcoming fees
- Calculates days overdue and late fees (5% after 30 days)
- Generates invoice URLs for payment portal
- Sends email reminders with payment details
- Optionally sends SMS reminders
- Checks reminder history to avoid duplicates (24-hour cooldown)
- Records all sent reminders in database

**Database Tables:**
- `association_fees` - Fee details and status
- `payment_reminders` - Tracks sent reminders (prevents duplicates)
- `households` - For household lookup
- `tenants` - For branding info

---

## User Creation Edge Functions

### create-admin-user
Creates admin users (admin_head or admin_officer) with auto-generated credentials.
- Validates caller is admin_head
- Generates secure temporary password
- Creates auth user with email confirmation
- Sends welcome email with credentials
- Required env: `RESEND_API_KEY`

### create-household-user
Creates household/resident users with auto-generated credentials.
- Creates household member auth accounts
- Generates temporary passwords
- Sends welcome email with mobile app access
- Required env: `RESEND_API_KEY`

### create-superadmin
Creates platform superadmin users.
- Platform-level administration access
- Auto-generated credentials
- Email notification with platform URL
- Required env: `RESEND_API_KEY`

### create-tenant
Creates new tenant communities with admin.
- Sets up new community/tenant
- Creates admin_head user
- Configures tenant settings
- Required env: `RESEND_API_KEY`

## Environment Variables

All Edge Functions require (automatically provided by Supabase):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `SUPABASE_ANON_KEY` - Anon key for RLS-respecting operations

Additional service-specific variables:

### Email (Resend) - **REQUIRED for user creation**
- `RESEND_API_KEY` - API key for Resend email service (**REQUIRED**)
- `DEFAULT_FROM_EMAIL` - Default sender email (optional, defaults to onboarding@resend.dev)

**Important Notes:**
- Without `RESEND_API_KEY`, user creation functions will succeed but users won't receive their login credentials via email.
- **Development Mode**: Use `onboarding@resend.dev` as FROM email (no domain verification needed)
  - Can ONLY send to the email address that created the Resend account
  - Perfect for testing
- **Production Mode**: Verify your own domain in Resend dashboard, then use your domain email
  - Can send to any email address
  - Required for production use
  - See: https://resend.com/docs/dashboard/domains/introduction

### Push Notifications (Firebase Cloud Messaging)
- `FCM_SERVER_KEY` - FCM server key for push notifications

### SMS (Twilio)
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number

### Payment (Stripe)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret

## Development

### Environment Setup (Local)

1. Copy the environment template:
```bash
cp supabase/.env.example supabase/.env
```

2. Fill in your API keys in `supabase/.env`:
```bash
RESEND_API_KEY=re_your_actual_key_here
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
# Add other keys as needed
```

3. **Important:** The `.env` file is gitignored for security. Never commit API keys!

### Local Testing

1. Start Supabase locally:
```bash
npx supabase start
```

2. Serve Edge Functions (loads .env automatically):
```bash
npx supabase functions serve
```

3. Test specific function with custom env file:
```bash
npx supabase functions serve send-announcement --env-file ./supabase/.env
```

4. Make test request:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-announcement' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"title":"Test","content":"Test content","urgency":"info","category":"general","target_audience":"all"}'
```

### Deployment

#### Set Production Environment Variables

Before deploying, set up your production secrets:

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-ref

# Set secrets from .env file
npx supabase secrets set --env-file supabase/.env

# Or set individual secrets
npx supabase secrets set RESEND_API_KEY=your_production_key
npx supabase secrets set DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# List current secrets (values are hidden)
npx supabase secrets list
```

#### Deploy Functions

Deploy all functions:
```bash
npx supabase functions deploy
```

Deploy specific function:
```bash
npx supabase functions deploy create-admin-user
```

#### View Production Logs

```bash
# View recent logs
npx supabase functions logs create-admin-user

# Stream live logs
npx supabase functions logs create-admin-user --follow
```

## Security

### Authentication
- All functions validate JWT tokens from Authorization header
- Admin-only functions check user role (admin_head, admin_officer)
- Stripe webhook uses signature verification instead of JWT

### Authorization
- Functions validate tenant_id matches authenticated user's tenant
- Service role client used for operations requiring elevated privileges
- Row-Level Security (RLS) bypassed only when necessary

### Input Validation
- All functions validate required fields
- TypeScript interfaces enforce type safety
- SQL injection prevented by parameterized queries

## Error Handling

All functions follow consistent error handling:
- Try-catch blocks around all operations
- Structured error logging with context
- HTTP status codes: 200 (success), 400 (bad request), 401/403 (auth), 404 (not found), 500 (server error)
- Error responses include descriptive messages

## Logging

All functions use structured JSON logging:
```typescript
logger.info("Operation completed", { userId, tenantId, count: 10 });
logger.warn("Potential issue detected", { reason: "..." });
logger.error("Operation failed", error, { context: "..." });
```

Logs include:
- Timestamp (ISO 8601)
- Log level (info, warn, error, debug)
- Message
- Context (function name, user ID, tenant ID, etc.)
- Error details (message, stack, name)

## Testing

### Unit Tests
Each function should have corresponding tests in `__tests__/` directory.

### Integration Tests
Test end-to-end functionality with real Supabase instance:
1. Create test tenant and users
2. Call function with test data
3. Verify database state and notifications
4. Clean up test data

### Manual Testing Checklist
- [ ] Authentication: Test with valid/invalid/missing JWT
- [ ] Authorization: Test with different user roles
- [ ] Validation: Test with missing/invalid required fields
- [ ] Business Logic: Test happy path and edge cases
- [ ] External Services: Verify email/SMS/push notifications
- [ ] Database: Confirm correct records created/updated
- [ ] Error Handling: Test failure scenarios
- [ ] Logging: Verify structured logs are generated

## Monitoring

Production monitoring recommendations:
1. **Logs:** Monitor Supabase Edge Function logs for errors
2. **Metrics:** Track function invocation count, duration, errors
3. **Alerts:** Set up alerts for high error rates or slow performance
4. **Email/SMS Delivery:** Monitor bounce rates and delivery failures
5. **Payment Processing:** Alert on failed webhook verifications

## Future Enhancements

### Planned Features
- [ ] Batch notification optimization (queue-based)
- [ ] Notification preferences per user
- [ ] Multi-language email templates
- [ ] SMS delivery status tracking
- [ ] Push notification token management
- [ ] Webhook retry logic for failed deliveries
- [ ] Rate limiting for notification sending

### Additional Edge Functions (Potential)
- `send-incident-alert` - Alert residents about security incidents
- `generate-invoice` - Generate PDF invoices for fees
- `export-residents` - Export resident data as CSV/Excel
- `backup-data` - Scheduled backups to external storage
- `send-newsletter` - Bulk email newsletters
- `analyze-payments` - Payment analytics and reports

## Support

For issues or questions:
- Check function logs in Supabase Dashboard
- Review error responses for diagnostic information
- Consult migration files for database schema
- Test locally with `supabase functions serve`

## License

Copyright © 2025 VillageTech. All rights reserved.
