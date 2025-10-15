# Village Tech System V2

**Comprehensive multi-tenant HOA management platform** enabling superadmins to onboard residential communities with complete isolation, admins to manage households and approvals, residents to request services via mobile apps, and security officers to control gate access with offline support.

[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-18%2B-brightgreen.svg)](https://nodejs.org/)
[![Flutter](https://img.shields.io/badge/flutter-3.16%2B-blue.svg)](https://flutter.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-5%2B-blue.svg)](https://www.typescriptlang.org/)

## Overview

Village Tech System V2 is a production-ready, enterprise-grade platform designed for managing residential communities (HOAs, condominiums, gated villages). It features:

- **Complete Tenant Isolation**: Row-Level Security (RLS) policies ensure zero cross-tenant data leakage
- **Multi-Platform**: 2 web apps (Next.js 15) + 2 mobile apps (Flutter) sharing a Supabase backend
- **Offline Capability**: Sentinel app functions offline for 4+ hours with automatic sync
- **Real-time Features**: Gate logs, guest approvals, and announcements using Supabase Realtime
- **Type-Safe**: TypeScript strict mode + Zod validation + Dart null safety
- **Accessible**: WCAG 2.1 AA compliant with Shadcn/ui (web) and Material 3 (mobile)
- **Scalable**: Supports 100 tenants, 5000 concurrent users, 1000 req/s

## Applications

| App | Platform | Target Users | Tech Stack |
|-----|----------|--------------|------------|
| **Platform** | Web (Next.js 15) | Superadmins | TypeScript, Tailwind, Shadcn/ui, TanStack Query |
| **Admin** | Web (Next.js 15) | HOA Officers | TypeScript, Tailwind, Shadcn/ui, TanStack Query |
| **Residence** | Mobile (Flutter) | Homeowners/Residents | Dart, Riverpod, Material 3, Hive |
| **Sentinel** | Mobile (Flutter) | Security Guards | Dart, Bloc, Material 3, Drift (offline) |

## Project Structure

```
village-tech-system-v2/
├── apps/
│   ├── platform/       # Platform Web App (Superadmin Portal) - Next.js
│   ├── admin/          # Admin Web App (HOA Officers Portal) - Next.js
│   ├── residence/      # Residence Mobile App - Flutter
│   └── sentinel/       # Sentinel Mobile App - Flutter
├── packages/
│   └── database-types/ # Shared TypeScript types from Supabase
├── supabase/
│   ├── migrations/     # Database migrations
│   ├── functions/      # Edge Functions
│   └── config.toml     # Supabase configuration
├── .github/
│   └── workflows/      # CI/CD pipelines
├── docs/               # Documentation
└── specs/              # Feature specifications
```

## Tech Stack

### Backend
- **Supabase**: PostgreSQL database, Auth, Realtime, Edge Functions, Storage
- **TypeScript**: Edge Functions runtime (Deno)

### Web Applications
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Shadcn/ui**: Accessible component library
- **TanStack Query**: Server state management
- **Zustand**: Client state management

### Mobile Applications
- **Flutter**: Cross-platform framework
- **Dart 3+**: Null-safe language
- **Riverpod** (Residence): Simple state management
- **Bloc** (Sentinel): Complex state with offline support
- **Hive/Drift**: Local storage for offline capability

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Flutter** 3.16+ and Dart 3+
- **Supabase CLI** (`npm install -g supabase`)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd village-tech-system-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Supabase locally**
   ```bash
   supabase start
   ```

4. **Run migrations**
   ```bash
   supabase db reset
   ```

5. **Generate TypeScript types**
   ```bash
   npm run supabase:types
   ```

### Development

#### Platform App (Port 3000)
```bash
npm run dev:platform
```

#### Admin App (Port 3001)
```bash
npm run dev:admin
```

#### Residence App
```bash
cd apps/residence
flutter pub get
flutter run
```

#### Sentinel App
```bash
cd apps/sentinel
flutter pub get
flutter run
```

## Commands

### Root Workspace
- `npm run lint` - Run ESLint on all web apps
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Type-check all TypeScript projects
- `npm run supabase:start` - Start local Supabase
- `npm run supabase:stop` - Stop local Supabase
- `npm run supabase:reset` - Reset database and run migrations
- `npm run supabase:types` - Generate TypeScript types from schema

### Web Apps (Platform/Admin)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler
- `npm run test` - Run Vitest tests

### Mobile Apps (Residence/Sentinel)
- `flutter pub get` - Install dependencies
- `flutter run` - Run app on connected device/emulator
- `flutter test` - Run unit tests
- `flutter analyze` - Run Dart analyzer
- `flutter build apk` - Build Android APK
- `flutter build ios` - Build iOS app

## Architecture

### Database Schema

The system uses PostgreSQL 15+ with Supabase and implements complete tenant isolation via Row-Level Security (RLS):

**Core Entities**:
- `tenants` - Residential communities (no RLS, superadmin-only)
- `user_profiles` - All users with tenant_id and roles
- `properties` - Physical addresses within communities
- `households` - Groups of residents assigned to properties
- `vehicle_stickers` - RFID/QR stickers for gate access
- `gates` - Entry/exit points with RFID readers
- `entry_exit_logs` - Complete gate activity audit trail
- `guests` - Pre-registered and walk-in visitors
- `construction_permits` - Building permits with road fees
- `announcements` - Communication from admin to residents
- `association_fees` - Monthly/annual dues with Stripe integration
- `incidents` - Security incident reports

See [data-model.md](./specs/001-residential-community-management/data-model.md) for full schema details.

### Authentication Flow

1. **Superadmins**: Direct login to Platform app (manage all tenants)
2. **Admin Officers**: Login to Admin app at `{subdomain}.admin.villagetech.app` (tenant-scoped)
3. **Residents**: Login to Residence mobile app (household-scoped)
4. **Security Guards**: Login to Sentinel mobile app with offline capability

All authentication uses Supabase Auth with JWT tokens containing `tenant_id` for RLS enforcement.

### Real-time Subscriptions

- **Guest Approvals**: Household receives push notification when guard requests approval (2-minute timeout)
- **Gate Logs**: Admin dashboard shows real-time entry/exit activity
- **Announcements**: Residents receive instant notifications for critical announcements
- **Incident Alerts**: Admins notified immediately when security reports incidents

## Features by User Story

### US1: Superadmin Creates New Community Tenant (Platform App)
- ✅ Multi-step tenant creation wizard
- ✅ Property import via CSV (up to 1000 properties)
- ✅ Gate configuration with RFID reader setup
- ✅ Admin user provisioning with email activation
- ✅ Subdomain validation and reservation
- ✅ Tenant branding (logo, colors)

### US2: Admin Head Sets Up Households (Admin App)
- ✅ Household registration with property assignment
- ✅ Household head account creation
- ✅ Vehicle sticker approval workflow (with OR/CR document review)
- ✅ Sticker allocation limits per household
- ✅ Bulk household import via CSV

### US3: Household Manages Family and Requests Services (Residence App)
- ✅ Add family members and beneficial users
- ✅ Request vehicle stickers with document upload
- ✅ Pre-register guests for upcoming visits
- ✅ Submit construction permit requests
- ✅ Pay association fees via Stripe
- ✅ View announcements and village rules

### US4: Security Officer Manages Gate Entry/Exit (Sentinel App)
- ✅ RFID sticker scanning with instant validation
- ✅ **Offline mode**: Cache valid stickers, sync when online
- ✅ Pre-registered guest check-in with QR codes
- ✅ Walk-in visitor approval (real-time household approval)
- ✅ Delivery tracking with overstay alerts (>30 min)
- ✅ Construction worker verification against permit lists
- ✅ Incident reporting with photo/video evidence

### US5: Admin Communicates and Monitors Community (Admin App)
- ✅ Send announcements with urgency levels and target audiences
- ✅ Track read receipts and acknowledgments
- ✅ Publish village rules with version control
- ✅ Generate association fee invoices (Stripe integration)
- ✅ Automated payment reminders (pg_cron scheduled jobs)
- ✅ Gate activity dashboard with analytics
- ✅ Review and resolve incident reports
- ✅ Curfew enforcement with exceptions

## Deployment

### Production URLs
- **Platform**: `platform.villagetech.app` (Vercel)
- **Admin**: `{tenant-subdomain}.admin.villagetech.app` (Vercel with wildcard routing)
- **Backend**: Supabase managed service
- **Mobile Apps**: iOS App Store, Google Play Store

### Environment Variables

#### Web Apps (Platform/Admin)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Mobile Apps (Residence/Sentinel)
Configure in `lib/core/supabase/supabase_client.dart`:
```dart
Supabase.initialize(
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key',
);
```

### CI/CD Pipelines

GitHub Actions workflows in `.github/workflows/`:
- `platform-deploy.yml` - Deploy Platform app to Vercel
- `admin-deploy.yml` - Deploy Admin app to Vercel
- `residence-build.yml` - Build and test Residence app
- `sentinel-build.yml` - Build and test Sentinel app

## Troubleshooting

### Common Issues

**1. Supabase connection failed**
```bash
# Restart Supabase
supabase stop
supabase start
```

**2. TypeScript types out of sync**
```bash
# Regenerate types after schema changes
npm run supabase:types
```

**3. Migration conflicts**
```bash
# Reset database and reapply all migrations
supabase db reset
```

**4. Flutter build errors**
```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run
```

**5. Port conflicts**
- Platform app: Change port in `apps/platform/package.json` (default: 3000)
- Admin app: Change port in `apps/admin/package.json` (default: 3001)
- Supabase: Default ports 54321 (API), 54323 (Studio)

### Logging and Monitoring

- **Supabase Insights**: Database query performance and error tracking
- **Vercel Analytics**: Web app page views and performance
- **Sentry** (TODO): Error tracking and crash reporting

## Contributing

### Code Style
- **TypeScript**: Follow ESLint + Prettier configurations
- **Dart**: Follow Dart analyzer rules in `analysis_options.yaml`
- **Commits**: Use conventional commits (feat, fix, docs, chore)

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Run `npm run lint` and `npm run typecheck`
4. Submit PR with description of changes
5. Wait for CI checks to pass
6. Request review from team lead

### Testing Requirements
- **Web**: Vitest unit tests + Playwright E2E tests
- **Mobile**: Flutter widget tests + integration tests
- **Backend**: Edge Function unit tests + RLS policy tests

## Documentation

- [Quickstart Guide](./specs/001-residential-community-management/quickstart.md) - Step-by-step setup
- [Implementation Plan](./specs/001-residential-community-management/plan.md) - Technical architecture
- [Data Model](./specs/001-residential-community-management/data-model.md) - Database schema
- [API Contracts](./specs/001-residential-community-management/contracts/README.md) - API specifications
- [Research](./specs/001-residential-community-management/research.md) - Technical decisions
- [Deployment Guide](./docs/deployment.md) - Production deployment steps
- [API Reference](./docs/api-reference.md) - Edge Functions documentation

## Performance Targets

- **Web**: Page load < 2 seconds, API response < 200ms (p95)
- **Mobile**: App launch < 3 seconds, smooth 60fps UI
- **Backend**: Support 100 tenants, 5000 concurrent users, 1000 req/s
- **Realtime**: Gate events reflected within 5-10 seconds
- **Offline**: Sentinel app caches 4+ hours of sticker data

## Security

- **Tenant Isolation**: RLS policies on all tenant-scoped tables
- **Authentication**: Supabase Auth with JWT, optional MFA (TOTP/SMS)
- **Authorization**: Role-based permissions in `user_profiles.role`
- **Data Encryption**: At-rest (Supabase) and in-transit (HTTPS)
- **Audit Logging**: All sensitive actions logged to `audit_logs` table
- **Rate Limiting**: Edge Functions protected by Supabase rate limiter

## Support

For issues, questions, or feature requests:
- **Internal**: Contact 98Labs development team
- **Docs**: See `./docs/` directory
- **Specs**: See `./specs/001-residential-community-management/`

## License

UNLICENSED - Proprietary software for 98Labs

---

**Maintained by**: 98Labs Development Team
**Last Updated**: 2025-10-15
**Version**: 2.0.0
