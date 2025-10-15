# Deployment Guide - Village Tech System V2

**Last Updated**: 2025-10-15
**Target Audience**: DevOps Engineers, System Administrators

## Overview

This guide provides step-by-step instructions for deploying Village Tech System V2 to production environments. The system consists of:

- **2 Web Apps** (Platform + Admin) deployed to Vercel
- **2 Mobile Apps** (Residence + Sentinel) distributed via app stores
- **Supabase Backend** (managed service)
- **Edge Functions** (deployed to Supabase)

---

## Prerequisites

### Required Accounts
- [ ] Supabase account (Production project created)
- [ ] Vercel account (Team plan recommended)
- [ ] Cloudflare account (DNS and CDN)
- [ ] Stripe account (Payment processing)
- [ ] Apple Developer account ($99/year - for iOS)
- [ ] Google Play Developer account ($25 one-time - for Android)
- [ ] GitHub account (CI/CD pipelines)

### Required Tools
- [ ] Node.js 18+ and npm
- [ ] Supabase CLI (`npm install -g supabase`)
- [ ] Vercel CLI (`npm install -g vercel`)
- [ ] Flutter 3.16+ and Dart SDK
- [ ] Fastlane (for mobile CI/CD)
- [ ] Git

### Domain Requirements
- [ ] Primary domain (e.g., `villagetech.app`)
- [ ] Wildcard SSL certificate for `*.admin.villagetech.app`

---

## Part 1: Supabase Backend Deployment

### Step 1: Create Production Project

1. **Log in to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Click "New Project"

2. **Configure Project**
   ```
   Organization: 98Labs
   Project Name: village-tech-production
   Database Password: [SECURE PASSWORD - Save in 1Password]
   Region: Southeast Asia (Singapore) - ap-southeast-1
   Plan: Pro ($25/month)
   ```

3. **Save Project Credentials**
   ```bash
   Project URL: https://[project-ref].supabase.co
   Anon Key: eyJhbGc...
   Service Role Key: eyJhbGc... [KEEP SECRET]
   JWT Secret: [KEEP SECRET]
   ```

### Step 2: Link Local Project to Production

```bash
cd /path/to/village-tech-system-v2

# Login to Supabase CLI
supabase login

# Link to production project
supabase link --project-ref [project-ref]
```

### Step 3: Run Database Migrations

```bash
# Push all migrations to production
supabase db push

# Verify migrations applied
supabase db remote diff
```

### Step 4: Deploy Edge Functions

```bash
# Deploy all Edge Functions
supabase functions deploy create-tenant
supabase functions deploy approve-sticker
supabase functions deploy approve-permit
supabase functions deploy request-guest-approval
supabase functions deploy sync-offline-logs
supabase functions deploy send-announcement
supabase functions deploy send-payment-reminder
supabase functions deploy enforce-rule-acknowledgment
supabase functions deploy stripe-webhook
supabase functions deploy create-household-user

# Verify deployment
supabase functions list
```

### Step 5: Configure Supabase Auth

1. **Navigate to Authentication > Providers**
2. **Enable Email Provider**
   - Email Auth: ✅ Enabled
   - Confirm Email: ✅ Enabled
   - Email Templates: Customize with branding

3. **Configure Auth Settings**
   ```
   Site URL: https://platform.villagetech.app
   Additional Redirect URLs:
     - https://admin.villagetech.app
     - https://*.admin.villagetech.app
     - villagetech://callback (for mobile deep linking)
   JWT Expiry: 3600 (1 hour)
   Refresh Token Expiry: 604800 (7 days)
   ```

4. **Enable MFA** (optional but recommended for admins)
   - TOTP: ✅ Enabled
   - SMS: Configure Twilio

### Step 6: Configure Storage Buckets

```bash
# Create storage buckets
supabase storage create-bucket property-documents --public false
supabase storage create-bucket sticker-documents --public false
supabase storage create-bucket permit-documents --public false
supabase storage create-bucket incident-photos --public false
supabase storage create-bucket tenant-logos --public true
supabase storage create-bucket announcements --public false

# Set RLS policies on buckets (tenant isolation)
# See: supabase/storage-policies.sql
```

### Step 7: Configure Realtime

```bash
# Enable Realtime for specific tables
supabase db remote exec "
ALTER PUBLICATION supabase_realtime ADD TABLE guest_approval_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE entry_exit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
"
```

### Step 8: Set Up pg_cron Jobs

```bash
# Payment reminder cron job (runs daily at 9 AM)
supabase db remote exec "
SELECT cron.schedule(
  'send-payment-reminders',
  '0 9 * * *',
  \$\$
  SELECT http_request(
    'POST',
    'https://[project-ref].supabase.co/functions/v1/send-payment-reminder',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  )
  FROM association_fees
  WHERE payment_status = 'overdue' AND due_date < CURRENT_DATE - INTERVAL '7 days';
  \$\$
);
"
```

### Step 9: Enable Database Backups

1. Go to **Settings > Database > Backups**
2. Enable **Point-in-Time Recovery** (PITR)
   - Retention: 7 days
   - Schedule: Daily at 02:00 UTC

---

## Part 2: Web Apps Deployment (Vercel)

### Platform App

#### Step 1: Connect GitHub Repository

1. Go to https://vercel.com/new
2. Import `village-tech-system-v2` repository
3. Select `apps/platform` as root directory

#### Step 2: Configure Build Settings

```
Framework Preset: Next.js
Root Directory: apps/platform
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Node Version: 18.x
```

#### Step 3: Set Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Optional
NEXT_PUBLIC_SITE_URL=https://platform.villagetech.app
NEXT_PUBLIC_APP_NAME=Village Tech Platform
VERCEL_ENV=production
```

#### Step 4: Configure Custom Domain

1. Go to **Settings > Domains**
2. Add domain: `platform.villagetech.app`
3. Configure DNS:
   ```
   Type: CNAME
   Name: platform
   Value: cname.vercel-dns.com
   TTL: Auto
   ```

#### Step 5: Deploy

```bash
# Automatic deployment on git push to main
git push origin main

# Or manual deployment
cd apps/platform
vercel --prod
```

### Admin App (with Wildcard Subdomain)

#### Step 1-3: Same as Platform App

Root Directory: `apps/admin`

#### Step 4: Configure Wildcard Domain

1. Add domains:
   - `admin.villagetech.app` (primary)
   - `*.admin.villagetech.app` (wildcard for tenants)

2. Configure DNS (Cloudflare):
   ```
   Type: CNAME
   Name: admin
   Value: cname.vercel-dns.com
   TTL: Auto

   Type: CNAME
   Name: *
   Value: admin.villagetech.app
   TTL: Auto
   Proxied: Yes (for Cloudflare CDN)
   ```

3. **Important**: Enable Wildcard Certificate
   - Go to Vercel dashboard
   - Navigate to **Settings > Domains**
   - Ensure SSL certificate covers `*.admin.villagetech.app`

#### Step 5: Configure Middleware for Subdomain Routing

The Admin app middleware automatically extracts `tenant_id` from subdomain:

```typescript
// apps/admin/src/middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];

  if (subdomain && subdomain !== 'admin') {
    // Tenant-specific subdomain (e.g., greenfield.admin.villagetech.app)
    // Fetch tenant_id from database and set in session
  }
}
```

---

## Part 3: Mobile Apps Deployment

### Residence App (iOS & Android)

#### Step 1: Configure App Bundle IDs

```yaml
# apps/residence/ios/Runner.xcodeproj/project.pbxproj
PRODUCT_BUNDLE_IDENTIFIER = com.villagetech.residence

# apps/residence/android/app/build.gradle
applicationId "com.villagetech.residence"
```

#### Step 2: Update Supabase Configuration

```dart
// apps/residence/lib/core/supabase/supabase_client.dart
await Supabase.initialize(
  url: 'https://[project-ref].supabase.co',
  anonKey: '[anon-key]',
  authCallbackUrlHostname: 'villagetech',
);
```

#### Step 3: Configure App Signing

**iOS (Xcode)**:
1. Open `apps/residence/ios/Runner.xcworkspace`
2. Select Runner target → Signing & Capabilities
3. Team: 98Labs
4. Provisioning Profile: App Store Distribution
5. Enable Push Notifications capability

**Android (Google Play Console)**:
```bash
cd apps/residence/android
# Generate keystore
keytool -genkey -v -keystore release.keystore -alias residence -keyalg RSA -keysize 2048 -validity 10000

# Add to android/key.properties
storePassword=[PASSWORD]
keyPassword=[PASSWORD]
keyAlias=residence
storeFile=release.keystore
```

#### Step 4: Build Release Binaries

**iOS**:
```bash
cd apps/residence
flutter build ios --release
# Open Xcode → Product → Archive → Distribute to App Store
```

**Android**:
```bash
cd apps/residence
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

#### Step 5: Submit to App Stores

**Apple App Store**:
1. Go to https://appstoreconnect.apple.com
2. Create new app:
   - Name: Village Tech Residence
   - Bundle ID: com.villagetech.residence
   - SKU: VILLAGETECH-RESIDENCE
3. Upload build via Xcode or Transporter
4. Fill app information:
   - Description, screenshots, privacy policy
   - Age rating: 4+
5. Submit for review (7-14 days)

**Google Play Store**:
1. Go to https://play.google.com/console
2. Create new app:
   - App name: Village Tech Residence
   - Default language: English
   - App or game: App
3. Upload AAB to Production track
4. Fill store listing:
   - Description, screenshots, privacy policy
   - Content rating: Everyone
5. Submit for review (1-3 days)

### Sentinel App (iOS & Android)

Same process as Residence app with different bundle IDs:
- iOS: `com.villagetech.sentinel`
- Android: `com.villagetech.sentinel`

---

## Part 4: CI/CD Pipelines (GitHub Actions)

### Platform App CI/CD

```yaml
# .github/workflows/platform-deploy.yml
name: Deploy Platform App

on:
  push:
    branches: [main]
    paths:
      - 'apps/platform/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: cd apps/platform && npm run typecheck
      - run: cd apps/platform && npm run lint
      - run: cd apps/platform && npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PLATFORM_PROJECT_ID }}
          working-directory: ./apps/platform
```

### Mobile Apps CI/CD

```yaml
# .github/workflows/residence-build.yml
name: Build Residence App

on:
  push:
    branches: [main]
    paths:
      - 'apps/residence/**'

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
      - run: cd apps/residence && flutter pub get
      - run: cd apps/residence && flutter analyze
      - run: cd apps/residence && flutter test
      - run: cd apps/residence && flutter build apk --release

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
      - run: cd apps/residence && flutter pub get
      - run: cd apps/residence && flutter analyze
      - run: cd apps/residence && flutter test
      - run: cd apps/residence && flutter build ios --release --no-codesign
```

---

## Part 5: External Integrations

### Stripe Setup

1. **Create Stripe Account**: https://dashboard.stripe.com
2. **Enable Payment Methods**:
   - Cards (Visa, Mastercard)
   - GCash, PayMaya (Philippines)
3. **Create Products**:
   - Association Fees (recurring)
   - Road Fees (one-time)
4. **Configure Webhooks**:
   ```
   Endpoint URL: https://[project-ref].supabase.co/functions/v1/stripe-webhook
   Events: payment_intent.succeeded, payment_intent.payment_failed
   ```
5. **Save Keys**:
   ```bash
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Email Service (SendGrid/Resend)

1. **Create SendGrid Account**: https://sendgrid.com
2. **Create API Key** with Mail Send permissions
3. **Verify Sender Domain**: `noreply@villagetech.app`
4. **Configure in Edge Functions**:
   ```typescript
   // supabase/functions/_shared/email.ts
   const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
   ```

### SMS Service (Twilio)

1. **Create Twilio Account**: https://twilio.com
2. **Get Phone Number** with SMS capability
3. **Save Credentials**:
   ```bash
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1234567890
   ```

### Push Notifications (Firebase Cloud Messaging)

1. **Create Firebase Project**: https://console.firebase.google.com
2. **Add Android App**: `com.villagetech.residence`
3. **Add iOS App**: `com.villagetech.residence`
4. **Download config files**:
   - Android: `google-services.json` → `apps/residence/android/app/`
   - iOS: `GoogleService-Info.plist` → `apps/residence/ios/Runner/`
5. **Save Server Key** for backend:
   ```bash
   FCM_SERVER_KEY=AAAA...
   ```

---

## Part 6: DNS Configuration (Cloudflare)

```
# A Records
platform.villagetech.app    →   76.76.21.21 (Vercel)
admin.villagetech.app        →   76.76.21.21 (Vercel)

# CNAME Records
*.admin.villagetech.app      →   admin.villagetech.app (Proxied)

# MX Records (Email)
villagetech.app              →   mx1.forwardemail.net (Priority: 10)

# TXT Records (SPF, DKIM)
villagetech.app              →   "v=spf1 include:sendgrid.net ~all"
```

---

## Part 7: Monitoring and Logging

### Supabase Insights

1. Navigate to **Reports > Database**
2. Monitor:
   - Query performance
   - Slow queries (>1s)
   - Table sizes
   - RLS policy overhead

### Vercel Analytics

1. Enable **Vercel Analytics** in dashboard
2. Monitor:
   - Page load times
   - Core Web Vitals
   - Error rates

### Sentry (Error Tracking)

1. Create Sentry project: https://sentry.io
2. Install SDKs:
   ```bash
   # Web apps
   npm install @sentry/nextjs

   # Mobile apps
   flutter pub add sentry_flutter
   ```
3. Configure:
   ```typescript
   // apps/platform/sentry.client.config.ts
   Sentry.init({
     dsn: 'https://...@sentry.io/...',
     environment: 'production',
   });
   ```

---

## Part 8: Security Checklist

- [ ] **Database**: RLS policies enabled on all tables
- [ ] **Auth**: JWT secrets rotated every 90 days
- [ ] **API Keys**: Service role keys stored in GitHub Secrets
- [ ] **Webhooks**: Stripe webhook signatures verified
- [ ] **HTTPS**: SSL certificates valid and auto-renewing
- [ ] **CORS**: Configured to allow only production domains
- [ ] **Rate Limiting**: Edge Functions protected
- [ ] **Backups**: Daily database backups enabled
- [ ] **Secrets**: Stored in 1Password (team vault)
- [ ] **2FA**: Enabled for all admin accounts

---

## Part 9: Post-Deployment Validation

### Smoke Tests

```bash
# 1. Test Platform app
curl -I https://platform.villagetech.app
# Expected: HTTP/2 200

# 2. Test Admin app (main)
curl -I https://admin.villagetech.app
# Expected: HTTP/2 200

# 3. Test Admin app (tenant subdomain)
curl -I https://testvillage.admin.villagetech.app
# Expected: HTTP/2 200

# 4. Test Edge Function
curl https://[project-ref].supabase.co/functions/v1/health
# Expected: {"status":"ok"}

# 5. Test Supabase Auth
curl -X POST https://[project-ref].supabase.co/auth/v1/signup \
  -H "apikey: [anon-key]" \
  -d '{"email":"test@example.com","password":"password123"}'
# Expected: User created
```

### End-to-End Tests

1. **Create Tenant** (Platform app)
   - Log in as superadmin
   - Create new tenant "Test Village"
   - Verify admin receives activation email

2. **Onboard Household** (Admin app)
   - Log in to `testvillage.admin.villagetech.app`
   - Create household with property
   - Verify household head receives credentials

3. **Request Sticker** (Residence app)
   - Log in as household head
   - Request vehicle sticker
   - Upload OR/CR document

4. **Approve Sticker** (Admin app)
   - Admin reviews sticker request
   - Approves with RFID serial
   - Verify resident receives notification

5. **Scan Sticker** (Sentinel app)
   - Log in as security officer
   - Scan RFID sticker
   - Verify entry logged in Admin dashboard

---

## Part 10: Rollback Procedures

### Rollback Web Apps (Vercel)

```bash
# List deployments
vercel ls apps/platform

# Rollback to previous deployment
vercel rollback apps/platform [deployment-url]
```

### Rollback Database Migrations

```bash
# Restore from PITR backup
supabase db remote restore --point-in-time "2025-10-15T10:00:00Z"
```

### Rollback Edge Functions

```bash
# Redeploy previous version from git
git checkout [previous-commit]
supabase functions deploy [function-name]
git checkout main
```

---

## Support Contacts

**Production Issues**:
- **On-Call Engineer**: +63 XXX XXX XXXX (PagerDuty)
- **Slack**: #village-tech-alerts
- **Email**: devops@98labs.com

**Service Status Pages**:
- Supabase: https://status.supabase.com
- Vercel: https://www.vercel-status.com
- Stripe: https://status.stripe.com

---

**Last Updated**: 2025-10-15
**Next Review**: 2026-04-15 (6 months)
**Version**: 2.0.0
