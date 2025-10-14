# Implementation Plan: Residential Community Management Platform - Multi-Tenant Foundation

**Branch**: `001-residential-community-management` | **Date**: 2025-10-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-residential-community-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

A comprehensive multi-tenant HOA management platform enabling superadmins to onboard residential communities with isolated tenants, admins to manage households and approvals, residents to request services via mobile apps, and security officers to control gate access. The platform uses **Supabase** (PostgreSQL + Auth + Realtime + Edge Functions + Storage) for the backend, **Next.js 15** (TypeScript + App Router) for web applications (Platform and Admin portals), and **Flutter** (Dart 3+) for mobile applications (Residence and Sentinel apps). Multi-tenancy is achieved through Row-Level Security (RLS) policies ensuring complete data isolation between communities.

## Technical Context

### Backend Stack
**Language/Version**: TypeScript (Node.js 18+) for Edge Functions, SQL (PostgreSQL 15+)
**Primary Backend**: Supabase (hosted PostgreSQL + Auth + Realtime + Edge Functions + Storage)
**Authentication**: Supabase Auth (JWT-based) with optional MFA (TOTP/SMS)
**Database**: PostgreSQL 15+ with Row-Level Security (RLS) for tenant isolation
**Realtime**: Supabase Realtime (WebSocket subscriptions for gate logs, announcements, incidents)
**Storage**: Supabase Storage (documents, permits, resident files, construction photos)
**Scheduling**: pg_cron (Supabase Scheduler for automated reports and payment reminders)
**Security**: RLS policies for tenant isolation, audit logging via triggers

### Web Applications (Platform & Admin)
**Framework**: Next.js 15 (TypeScript, App Router, Server Components)
**Language**: TypeScript 5+
**Data Fetching**: TanStack Query for caching and state synchronization
**State Management**: Zustand for UI and session control
**Forms**: React Hook Form + Zod for validation
**UI Framework**: Tailwind CSS + Shadcn/ui (accessible, themeable components)
**Integration**: @supabase/supabase-js client for DB, Auth, Realtime, Storage
**Deployment**: Vercel (auto-deploy, Edge CDN, SSR/ISR, environment secrets)
**Testing**: Vitest (unit/integration), Playwright (E2E)

### Mobile Applications (Residence & Sentinel)
**Framework**: Flutter (Dart 3+)
**State Management**: Riverpod or Bloc (depending on feature complexity)
**Routing**: go_router for declarative navigation
**Offline Support**: Hive or Drift for local data caching
**Integration**: supabase_flutter SDK for auth, database, realtime, storage
**UI**: Material 3 + custom HOA theme per tenant (tenant-specific branding)
**Features**: QR scanning (mobile_scanner, qr_flutter), push notifications (flutter_local_notifications), payments (flutter_stripe), file uploads (file_picker, image_picker), maps (Google Maps Flutter)
**Deployment**: Fastlane (CI/CD), Google Play Console (Android), App Store Connect (iOS)
**Testing**: Flutter Test + Integration Tests (integration_test)

### Infrastructure & DevOps
**Backend Hosting**: Supabase (managed service)
**Web Hosting**: Vercel (Next.js auto-deploy)
**Mobile Distribution**: App Store (iOS), Play Store (Android)
**CI/CD**: GitHub Actions (lint → test → build → deploy)
**Monitoring**: Supabase Insights + Vercel Analytics + Sentry
**CDN & DNS**: Cloudflare
**Caching**: TanStack Query (client-side) + Vercel Edge Cache (CDN)

### External Integrations
**Payments**: Stripe (community dues, permit fees)
**SMS**: Twilio or Supabase Functions (notifications, 2FA)
**Email**: SendGrid or Resend (alerts, onboarding, invoices)
**Security**: Cloudflare (DDoS protection)

### Project Type
**Multi-platform**: 2 Next.js web apps + 2 Flutter mobile apps + Shared Supabase backend

### Performance Goals
- **Web**: Page load < 2 seconds, API response < 200ms (p95)
- **Mobile**: App launch < 3 seconds, smooth 60fps UI, offline mode for Sentinel (4+ hours)
- **Backend**: Support 100 tenants, 5000 concurrent users, 1000 req/s
- **Realtime**: Gate events and approvals reflected within 5-10 seconds

### Constraints
- **Tenant Isolation**: Complete data separation via RLS (zero cross-tenant leakage)
- **Offline Capability**: Sentinel app MUST function offline with local cache
- **WCAG 2.1 AA**: All web/mobile UIs must meet accessibility standards
- **Mobile Platforms**: iOS 14+, Android 8+ (API 26+)
- **Load Time**: Core operations under 2 seconds (constitutional requirement)

### Scale/Scope
- **Tenants**: 100 active communities
- **Users**: 5000 concurrent across all apps
- **Data Volume**: 10k+ households, 100k+ gate logs per month
- **Mobile Apps**: 2 Flutter apps (Residence + Sentinel), ~50-70 screens total
- **Web Apps**: 2 Next.js apps (Platform + Admin), ~40-50 pages total
- **Codebase**: Estimated 50k-80k LOC across all apps

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Code Quality & Testing (Principle I)
- **TypeScript strict mode**: Enforced across all Next.js and Edge Functions → Passes type safety requirement
- **Flutter null safety**: Dart 3+ enables null-safe code → Passes type safety requirement
- **ESLint + Prettier (web)**: Configured for Next.js projects → Passes static analysis requirement
- **Dart Analyzer (mobile)**: Built into Flutter tooling → Passes static analysis requirement
- **Testing strategy**: Vitest (web unit), Playwright (web E2E), Flutter Test (mobile) → Passes testing standards
- **McCabe complexity**: Enforced via ESLint (web) and dartanalyzer (mobile) → Passes clean code requirement
- **Performance target**: < 2s load time documented in Technical Context → Passes performance requirement

### ✅ UX & Design Principles (Principle II)
- **Accessibility**: Shadcn/ui (web) and Material 3 (mobile) both support WCAG 2.1 AA → Passes accessibility requirement
- **Mobile-first**: Flutter apps are natively mobile; Next.js apps use responsive Tailwind → Passes mobile-first requirement
- **Design tokens**: Tailwind config (web) + Material 3 theme (mobile) → Passes design tokens requirement
- **Dark mode**: Supported in both Shadcn/ui and Material 3 → Passes dark mode requirement
- **Icon consistency**: Using approved libraries (web: Lucide, mobile: Material Icons) → Passes icon requirement

### ✅ Backend (Supabase) Principles (Principle III)
- **Row-Level Security**: RLS policies defined for all tenant data → Passes security-first requirement
- **Type safety**: TypeScript with strict mode enabled (`strict: true`) for Edge Functions and web applications. All compiler options including `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, and `strictPropertyInitialization` must be enabled. Zod for validation. Dart null safety required for Flutter. → Passes type safety requirement
- **Modular structure**: Edge Functions organized by domain (auth, permits, gates, announcements) → Passes modular structure requirement
- **Performance monitoring**: Supabase Insights + query profiling → Passes performance monitoring requirement
- **Data privacy**: RLS ensures tenant isolation, audit logs track access → Passes privacy/compliance requirement
- **CI/CD**: GitHub Actions automate tests and deployments → Passes CI/CD requirement

### ✅ Mobile (Flutter) Principles (Principle IV)
- **Clean architecture**: Riverpod/Bloc pattern enforced → Passes clean architecture requirement
- **Cross-platform**: Flutter targets iOS, Android, Web → Passes cross-platform consistency requirement
- **State management**: Riverpod or Bloc (documented in Technical Context) → Passes state management requirement
- **Offline support**: Hive/Drift for local caching → Passes offline support requirement
- **Accessibility**: Material 3 follows Flutter a11y guidelines → Passes accessibility compliance requirement
- **Automated testing**: Flutter Test + integration_test → Passes automated testing requirement

### ✅ Development Standards
- **Code organization**: Monorepo structure with submodules per app → Passes separation of concerns
- **Dependency management**: package.json (web), pubspec.yaml (mobile) with version pinning → Passes dependency management
- **Version control**: Conventional commits enforced via Husky → Passes version control practices

### ⚠️ Potential Violations Requiring Justification
**None identified** - all constitutional requirements align with chosen tech stack.

**GATE STATUS**: ✅ **PASS** - Proceed to Phase 0 Research

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (Monorepo with Git Submodules)

```
village-tech-system-v2/                  # Main monorepo
├── apps/
│   ├── platform/                        # Platform Web App (Superadmin Portal)
│   │   ├── src/
│   │   │   ├── app/                     # Next.js App Router
│   │   │   │   ├── (auth)/             # Auth routes
│   │   │   │   ├── (dashboard)/        # Dashboard routes
│   │   │   │   ├── tenants/            # Tenant management
│   │   │   │   └── layout.tsx
│   │   │   ├── components/              # Shadcn/ui components
│   │   │   ├── lib/                     # Utilities, Supabase client
│   │   │   └── types/                   # TypeScript types
│   │   ├── tests/
│   │   │   ├── unit/                    # Vitest tests
│   │   │   └── e2e/                     # Playwright tests
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   ├── admin/                           # Admin Web App (HOA Officers Portal)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── households/         # Household management
│   │   │   │   ├── approvals/          # Sticker & permit approvals
│   │   │   │   ├── announcements/      # Communication
│   │   │   │   ├── fees/               # Association fees
│   │   │   │   └── settings/           # Village rules, gates
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── types/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   ├── residence/                       # Residence Mobile App (Flutter)
│   │   ├── lib/
│   │   │   ├── main.dart
│   │   │   ├── features/                # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   ├── household/          # Family management
│   │   │   │   ├── stickers/           # Vehicle sticker requests
│   │   │   │   ├── permits/            # Construction permits
│   │   │   │   ├── guests/             # Guest pre-registration
│   │   │   │   └── announcements/      # View announcements
│   │   │   ├── core/                    # Shared utilities
│   │   │   │   ├── theme/              # Material 3 theme
│   │   │   │   ├── routing/            # go_router config
│   │   │   │   └── supabase/           # Supabase client
│   │   │   └── shared/                  # Shared widgets
│   │   ├── test/                        # Flutter tests
│   │   ├── integration_test/
│   │   └── pubspec.yaml
│   │
│   └── sentinel/                        # Sentinel Mobile App (Flutter)
│       ├── lib/
│       │   ├── main.dart
│       │   ├── features/
│       │   │   ├── auth/
│       │   │   ├── gate_scanning/      # RFID/QR scanning
│       │   │   ├── residents/          # Resident verification
│       │   │   ├── guests/             # Guest check-in
│       │   │   ├── deliveries/         # Delivery tracking
│       │   │   ├── permits/            # Construction worker verify
│       │   │   └── incidents/          # Incident reporting
│       │   ├── core/
│       │   │   ├── offline/            # Offline cache (Hive/Drift)
│       │   │   └── supabase/
│       │   └── shared/
│       ├── test/
│       ├── integration_test/
│       └── pubspec.yaml
│
├── packages/                             # Shared packages
│   ├── database-types/                   # Generated Supabase types (TS + Dart)
│   ├── shared-ui-web/                    # Shared React components
│   └── shared-ui-mobile/                 # Shared Flutter widgets
│
├── supabase/                             # Supabase configuration
│   ├── migrations/                       # SQL migrations
│   │   ├── 00001_create_tenants.sql
│   │   ├── 00002_create_users_and_roles.sql
│   │   ├── 00003_create_households.sql
│   │   ├── 00004_create_gates_and_stickers.sql
│   │   └── 00005_create_rls_policies.sql
│   ├── functions/                        # Edge Functions
│   │   ├── permit-approval/             # Permit workflow
│   │   ├── payment-webhook/             # Stripe webhook
│   │   ├── announcement-notify/         # Push notifications
│   │   └── gate-log-sync/               # Realtime sync
│   ├── seed.sql                          # Seed data
│   └── config.toml                       # Supabase config
│
├── .github/
│   └── workflows/
│       ├── platform-deploy.yml           # CI/CD for Platform app
│       ├── admin-deploy.yml              # CI/CD for Admin app
│       ├── residence-build.yml           # CI/CD for Residence app
│       └── sentinel-build.yml            # CI/CD for Sentinel app
│
├── docs/                                 # Documentation
│   ├── architecture.md
│   ├── database-schema.md
│   └── deployment.md
│
└── package.json                          # Root workspace config
```

**Structure Decision**: Multi-platform monorepo with **Git submodules** for each application (platform, admin, residence, sentinel). Each app maintains independent versioning and deployment while sharing the Supabase backend schema. The `packages/` directory contains shared code (types, UI components) to reduce duplication. This structure supports parallel development by different teams while maintaining centralized CI/CD and database migrations.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

**No violations** - Constitution Check passed without exceptions. All architectural decisions align with constitutional principles.
