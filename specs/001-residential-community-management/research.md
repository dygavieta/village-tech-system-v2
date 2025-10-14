# Phase 0 Research: Residential Community Management Platform

**Feature**: 001-residential-community-management
**Date**: 2025-10-10
**Status**: Complete

## Research Objectives

This document consolidates architectural research, technology choices, and best practices for implementing a multi-tenant HOA management platform with 4 specialized applications (Platform, Admin, Residence, Sentinel) powered by Supabase and serving web (Next.js) and mobile (Flutter) clients.

---

## Key Architectural Decisions

### 1. Multi-Tenancy Strategy

**Decision**: Single shared PostgreSQL database with row-level tenant isolation via tenant_id column and Row-Level Security (RLS) policies

**Rationale**:
- **Data Isolation**: RLS policies in PostgreSQL provide strong guarantees of tenant data separation through tenant_id filtering
- **Simplified Operations**: Single database simplifies schema migrations, backups, and disaster recovery (all tenants migrate atomically)
- **Performance**: Reduces connection overhead and enables efficient cross-tenant analytics for superadmin
- **Supabase Native**: RLS is a core Supabase feature with first-class support and automatic policy enforcement
- **Cost Efficiency**: Shared infrastructure reduces operational costs vs. database-per-tenant or schema-per-tenant approaches
- **Scalability Path**: Architecture supports future migration to separate schemas or databases if requirements change

**Alternatives Considered**:
- **Schema-per-tenant**: Rejected due to migration complexity (sequential per-schema migrations) and connection pool management overhead
- **Database-per-tenant**: Rejected due to connection pool limits (100 tenants = 100 databases), highest migration complexity, and infrastructure costs
- **Application-level filtering**: Rejected due to security risks (one bug = data leakage), insufficient audit trail, no database-level enforcement

**Implementation Pattern**:
```sql
-- Example RLS policy for tenants table
CREATE POLICY tenant_isolation ON households
  FOR ALL USING (
    tenant_id = auth.jwt() ->> 'tenant_id'::text
  );
```

**References**:
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Best Practices](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

### 2. State Management (Flutter)

**Decision**: Riverpod for Residence app, Bloc for Sentinel app

**Rationale**:
- **Riverpod (Residence)**: Simpler feature requirements (CRUD operations, forms), declarative state, less boilerplate
- **Bloc (Sentinel)**: Complex offline requirements, event-driven architecture for gate scanning, explicit state transitions for audit logs

**Alternatives Considered**:
- **Provider**: Rejected due to lack of compile-time safety and deprecated status in favor of Riverpod
- **GetX**: Rejected due to tight coupling and opinionated service locator pattern

**Implementation Pattern**:
```dart
// Riverpod for simple state (Residence app)
final householdProvider = FutureProvider.autoDispose<Household>((ref) async {
  final supabase = ref.watch(supabaseClientProvider);
  final data = await supabase.from('households').select().single();
  return Household.fromJson(data);
});

// Bloc for complex state (Sentinel app)
class GateScanBloc extends Bloc<GateScanEvent, GateScanState> {
  GateScanBloc() : super(GateScanInitial()) {
    on<ScanRFIDEvent>(_onScanRFID);
    on<VerifyOfflineEvent>(_onVerifyOffline);
  }
}
```

**References**:
- [Riverpod Official Docs](https://riverpod.dev/)
- [Bloc Pattern Guide](https://bloclibrary.dev/)

---

### 3. Offline Support Strategy (Sentinel App)

**Decision**: Hive for local key-value cache + Drift for structured offline data

**Rationale**:
- **Hive**: Fast, NoSQL-like storage for recent resident stickers and gate configurations
- **Drift**: SQL-based ORM for complex offline queries (e.g., "find all active permits for this address")
- **Sync Strategy**: Queue entry logs locally, batch sync when online using Supabase Edge Functions

**Alternatives Considered**:
- **Shared Preferences**: Rejected due to 1MB size limit and lack of query capability
- **SQLite (sqflite)**: Rejected in favor of Drift's type-safe API and migration support

**Implementation Pattern**:
```dart
// Hive for simple cache
@HiveType(typeId: 1)
class CachedSticker {
  @HiveField(0)
  final String rfidSerial;

  @HiveField(1)
  final String householdId;

  @HiveField(2)
  final DateTime cachedAt;
}

// Drift for offline logs
class OfflineEntryLogs extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get stickerRFID => text()();
  DateTimeColumn get entryTime => dateTime()();
  BoolColumn get synced => boolean().withDefault(const Constant(false))();
}
```

**References**:
- [Hive Documentation](https://docs.hivedb.dev/)
- [Drift Official Guide](https://drift.simonbinder.eu/)

---

### 4. Real-Time Synchronization

**Decision**: Supabase Realtime with WebSocket subscriptions

**Rationale**:
- **Gate Events**: Guards need instant notifications when household approves guest entry
- **Announcements**: Push critical alerts to all residents in real-time
- **Incident Alerts**: Notify admin immediately when security reports incidents
- **Built-in Supabase Feature**: No additional infrastructure required

**Alternatives Considered**:
- **Firebase Realtime Database**: Rejected due to migration costs and vendor lock-in
- **Polling**: Rejected due to inefficiency (wasted requests) and 5-10 second delay requirement

**Implementation Pattern**:
```typescript
// Next.js (Admin app) - Subscribe to approval requests
const subscription = supabase
  .channel('guest_approvals')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'guest_entry_requests' },
    (payload) => {
      // Notify household in real-time
      toast.success(`Guest ${payload.new.guest_name} requests entry`);
    }
  )
  .subscribe();
```

```dart
// Flutter (Residence app) - Subscribe to announcements
supabase
  .from('announcements')
  .stream(primaryKey: ['id'])
  .eq('tenant_id', currentTenantId)
  .listen((data) {
    // Show push notification
    showNotification(data.first['title']);
  });
```

**References**:
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Realtime Broadcast & Presence](https://supabase.com/docs/guides/realtime/broadcast)

---

### 5. Payment Integration

**Decision**: Stripe for online payments (dues, permit fees)

**Rationale**:
- **Global Coverage**: Supports credit/debit cards, bank transfers, wallets
- **Flutter Support**: `flutter_stripe` package for mobile integration
- **Webhooks**: Supabase Edge Functions handle payment confirmations
- **PCI Compliance**: Stripe handles sensitive card data, reducing compliance burden

**Alternatives Considered**:
- **PayPal**: Rejected due to higher fees and less developer-friendly API
- **Local Payment Gateways (e.g., PayMongo for PH)**: Retained as configurable option per tenant

**Implementation Pattern**:
```typescript
// Supabase Edge Function - Stripe Webhook
export default async function handler(req: Request) {
  const signature = req.headers.get('stripe-signature');
  const event = stripe.webhooks.constructEvent(await req.text(), signature, webhookSecret);

  if (event.type === 'payment_intent.succeeded') {
    const permitId = event.data.object.metadata.permit_id;
    await supabase
      .from('construction_permits')
      .update({ payment_status: 'paid', status: 'active' })
      .eq('id', permitId);
  }

  return new Response(JSON.stringify({ received: true }));
}
```

**References**:
- [Stripe API Docs](https://stripe.com/docs/api)
- [Flutter Stripe Plugin](https://pub.dev/packages/flutter_stripe)
- [Supabase Edge Functions with Stripe](https://supabase.com/docs/guides/functions/examples/stripe-webhooks)

---

### 6. Authentication & Authorization

**Decision**: Supabase Auth with custom claims for role-based access

**Rationale**:
- **JWT-Based**: Stateless authentication, works across all apps
- **Built-in MFA**: TOTP/SMS for admin and superadmin accounts
- **Custom Claims**: `tenant_id` and `role` embedded in JWT for RLS policies
- **Magic Links**: Passwordless login for residents (better UX for non-technical users)

**Alternatives Considered**:
- **NextAuth**: Rejected due to redundancy (Supabase Auth already handles sessions)
- **Custom Auth**: Rejected due to security risks and maintenance overhead

**Implementation Pattern**:
```sql
-- RLS policy using JWT claims
CREATE POLICY household_access ON households
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
      auth.jwt() ->> 'role' = 'admin'
      OR household_head_id = auth.uid()
    )
  );
```

```typescript
// Next.js - Custom claims after sign-up
const { data, error } = await supabase.auth.signUp({
  email: 'admin@community.com',
  password: 'secure-password',
  options: {
    data: {
      tenant_id: tenantId,
      role: 'admin_head'
    }
  }
});
```

**References**:
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Custom Claims with RLS](https://supabase.com/docs/guides/auth/row-level-security#custom-claims)

---

### 7. File Storage & Document Management

**Decision**: Supabase Storage with RLS policies per tenant

**Rationale**:
- **Tenant Isolation**: Storage buckets can enforce RLS (e.g., `construction_permits/{tenant_id}/{permit_id}/`)
- **CDN Integration**: Supabase Storage uses CloudFlare CDN for fast global access
- **Size Limits**: 50MB per file (sufficient for permits, vehicle registrations, incident photos)

**Alternatives Considered**:
- **AWS S3**: Rejected due to additional infrastructure complexity and cost
- **Cloudinary**: Rejected due to cost for non-image documents (PDFs, contracts)

**Implementation Pattern**:
```dart
// Flutter - Upload permit document
final file = await FilePicker.platform.pickFiles();
final path = 'construction_permits/$tenantId/$permitId/${file.name}';

await supabase.storage
  .from('documents')
  .upload(path, File(file.path!));

final publicUrl = supabase.storage.from('documents').getPublicUrl(path);
```

**References**:
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Storage RLS Policies](https://supabase.com/docs/guides/storage#policy-examples)

---

### 8. Database Migration Strategy

**Decision**: Sequential SQL migrations in `supabase/migrations/` with timestamp prefixes

**Rationale**:
- **Version Control**: Migrations tracked in Git, applied via Supabase CLI
- **Rollback Support**: Down migrations for safe rollbacks
- **Idempotent**: `IF NOT EXISTS` checks prevent accidental re-runs

**Alternatives Considered**:
- **Prisma Migrate**: Rejected due to limited Supabase integration and ORM overhead
- **Drizzle**: Considered but Supabase CLI migration system is simpler and official

**Implementation Pattern**:
```sql
-- supabase/migrations/00001_create_tenants.sql
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
```

**References**:
- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)

---

### 9. Testing Strategy

**Decision**: Layered testing (Unit → Integration → E2E)

**Web (Next.js)**:
- **Unit**: Vitest for utils, hooks, components
- **Integration**: Vitest + MSW (Mock Service Worker) for API mocking
- **E2E**: Playwright for critical flows (tenant creation, household onboarding, permit approval)

**Mobile (Flutter)**:
- **Unit**: `flutter_test` for business logic, providers
- **Widget**: `flutter_test` for UI components
- **Integration**: `integration_test` for flows (sticker request, guest pre-registration)

**Backend**:
- **Edge Functions**: Deno Test for Supabase Functions
- **Database**: SQL test fixtures with RLS policy validation

**Rationale**:
- **Fast Feedback**: Unit tests run in < 5s, catch 80% of bugs
- **Realistic**: Integration tests with MSW simulate real API responses
- **Confidence**: E2E tests validate user-facing workflows before release

**References**:
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Flutter Testing Guide](https://docs.flutter.dev/testing)

---

### 10. CI/CD Pipeline

**Decision**: GitHub Actions with parallel jobs per app

**Rationale**:
- **Parallel Builds**: Platform, Admin, Residence, Sentinel apps build simultaneously
- **Automated Deployment**: Vercel (web), Fastlane + Codemagic (mobile)
- **Quality Gates**: Lint → Test → Build → Deploy (fail fast)

**Implementation Pattern**:
```yaml
# .github/workflows/platform-deploy.yml
name: Platform App CI/CD

on:
  push:
    branches: [main]
    paths: ['apps/platform/**']

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  deploy:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

**References**:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel GitHub Integration](https://vercel.com/docs/git/vercel-for-github)
- [Fastlane CI/CD](https://docs.fastlane.tools/best-practices/continuous-integration/)

---

### 11. Differentiated Authentication Strategy

**Decision**: User-type-specific authentication: Admins (mandatory 2FA), Household heads (optional 2FA), Family members (password only), Security officers (PIN + biometric)

**Rationale**:
- **Risk-Based Security**: Higher privileges (admins) require stronger authentication; lower-risk users get simpler UX
- **Mobile Biometrics**: Security officers use PIN + fingerprint/face recognition for fast gate operations without typing passwords
- **User Experience**: Family members (often non-technical users) get streamlined password-only auth to reduce friction
- **Compliance Ready**: Mandatory 2FA for admins meets common security audit requirements

**Alternatives Considered**:
- **Universal 2FA**: Rejected due to poor UX for residents and elderly users who struggle with TOTP apps
- **Password-only for all**: Rejected due to inadequate security for admin and financial operations

**Implementation Pattern**:
```typescript
// Supabase Auth - Enforce 2FA for admins
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'Admin 2FA'
});

// Flutter Biometric Auth (Security officers)
final LocalAuthentication auth = LocalAuthentication();
final bool canAuthenticateBiometrics = await auth.canCheckBiometrics;
if (canAuthenticateBiometrics) {
  final bool didAuthenticate = await auth.authenticate(
    localizedReason: 'Scan fingerprint to access Sentinel',
    options: const AuthenticationOptions(biometricOnly: true)
  );
}
```

**References**:
- [Supabase MFA Documentation](https://supabase.com/docs/guides/auth/auth-mfa)
- [Flutter Local Auth Plugin](https://pub.dev/packages/local_auth)

---

### 12. Disaster Recovery & Backup Strategy

**Decision**: Real-time synchronous replication to secondary region with automated failover (RTO=15min, RPO=0) + continuous point-in-time backup (1-year retention, 30-min restore)

**Rationale**:
- **Zero Data Loss**: Synchronous replication ensures no transaction is lost during region failure
- **Fast Recovery**: 15-minute automated failover meets 99.5% uptime SLA
- **Compliance**: 1-year backup retention supports audit requirements for financial and access control data
- **Multi-Region Safety**: 3 geographically distributed backup locations protect against regional disasters

**Alternatives Considered**:
- **Asynchronous replication**: Rejected due to potential data loss (RPO > 0)
- **Daily backups only**: Rejected due to inadequate RTO (24+ hours) for critical security operations
- **Single-region backups**: Rejected due to regional disaster risk (fire, flood, datacenter failure)

**Implementation Pattern**:
```sql
-- Supabase/PostgreSQL Logical Replication (managed by Supabase)
-- Automatic in Supabase Pro/Enterprise plans with multi-region setup

-- Point-in-Time Recovery (PITR)
-- Restore to specific timestamp via Supabase CLI:
-- supabase db restore --timestamp "2025-10-14T10:30:00Z"
```

**References**:
- [Supabase High Availability](https://supabase.com/docs/guides/platform/going-into-prod#high-availability)
- [PostgreSQL Streaming Replication](https://www.postgresql.org/docs/current/warm-standby.html)

---

### 13. Observability & Monitoring Stack

**Decision**: Full observability with structured logging, comprehensive metrics, distributed tracing, APM integration, and automated alerting

**Rationale**:
- **Structured Logging**: JSON logs with tenant_id, user_id, trace_id enable fast troubleshooting across distributed system
- **Business Metrics**: Track gate scans/hour, approval response times, payment success rates for SLA monitoring
- **Distributed Tracing**: Follow requests across Next.js → Supabase Edge Functions → PostgreSQL for performance debugging
- **Automated Alerts**: Proactive detection of API errors, latency spikes, authentication failures before users report issues
- **Compliance**: Immutable audit logs for sensitive operations meet regulatory requirements

**Alternatives Considered**:
- **Basic logs only**: Rejected due to insufficient visibility for debugging distributed system issues
- **Metrics without tracing**: Rejected because tracing is essential for identifying bottlenecks in multi-service flows
- **Self-hosted observability**: Rejected due to operational overhead; managed platforms (Datadog/New Relic) offer better reliability

**Implementation Pattern**:
```typescript
// Structured logging in Edge Functions
import { Logger } from '@supabase/functions-js';

const logger = new Logger({
  tenant_id: req.headers.get('x-tenant-id'),
  trace_id: req.headers.get('x-trace-id')
});

logger.info('Processing permit approval', {
  permit_id: permitId,
  user_id: userId
});

// APM integration with Sentry
Sentry.init({
  dsn: Deno.env.get('SENTRY_DSN'),
  tracesSampleRate: 1.0,
  beforeSend(event) {
    event.tags = {
      ...event.tags,
      tenant_id: currentTenantId
    };
    return event;
  }
});
```

**Alerting Thresholds**:
- API error rate > 5% → Critical alert
- p95 latency > 500ms → Warning alert
- Authentication failures > 10/min/user → Security alert
- Sentinel app offline > 15min → Critical alert

**References**:
- [Supabase Logging](https://supabase.com/docs/guides/platform/logs)
- [Sentry for Deno](https://docs.sentry.io/platforms/javascript/guides/deno/)
- [Datadog APM Integration](https://docs.datadoghq.com/tracing/)

---

## Best Practices Summary

### Supabase Patterns
1. **Always enable RLS** on all tables containing tenant data
2. **Use Database Functions** for complex business logic (e.g., permit fee calculation)
3. **Leverage Triggers** for audit logging (created_at, updated_at, changed_by)
4. **Batch Realtime Subscriptions** to avoid connection limits (1 subscription per feature, not per record)

### Next.js Patterns
1. **Server Components by Default**: Only use Client Components when needed (forms, interactivity)
2. **Route Handlers for API**: Avoid mixing server logic in page components
3. **TanStack Query for Data Fetching**: Automatic caching, revalidation, and optimistic updates

### Flutter Patterns
1. **Feature-First Structure**: Organize by feature (household/, stickers/) not by layer (models/, views/)
2. **Freezed for Immutability**: Use `freezed` package for state classes and DTOs
3. **Responsive Design**: Use `LayoutBuilder` and `MediaQuery` for adaptive layouts

### Security Patterns
1. **Validate Input on Server**: Never trust client-side validation alone
2. **Rate Limiting**: Apply to Edge Functions (e.g., 100 requests/minute per user)
3. **Audit All Sensitive Actions**: Log permit approvals, fee modifications, gate overrides

---

## Open Questions & Future Research

**None** - All technical decisions finalized based on provided references/plans.md.

---

## Conclusion

The research phase confirms that the chosen technology stack (Supabase + Next.js + Flutter) aligns with constitutional requirements and project goals. All architectural decisions have been validated against best practices, and implementation patterns are documented for consistency across the team.

**Next Phase**: Proceed to Phase 1 - Data Model & Contracts
