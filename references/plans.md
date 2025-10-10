# 🏗️ Project: Village Tech — HOA Management Platform

A **modern, secure, and scalable platform** designed to manage multiple **residential communities** governed by **homeowners associations (HOAs)**.  
Each community operates as an independent **tenant**, ensuring complete data isolation, real-time responsiveness, and smooth user experiences — powered entirely by **Supabase** (backend + infrastructure) and **Next.js** (frontend + API routes).

---

## ⚙️ TECHNOLOGY OVERVIEW

### BACKEND (Supabase)
- **Supabase Stack**
  - PostgreSQL 15+ (managed by Supabase)
  - Row-Level Security (RLS) for tenant isolation  
  - Supabase Auth (JWT-based authentication & authorization)
  - Supabase Storage for documents, permits, and resident files
  - Supabase Realtime for gate monitoring and announcements
  - Supabase Edge Functions for workflows (permit approvals, gate logs, notifications)
  - Supabase Scheduler (via `pg_cron`) for automated reports and reminders
  - Optional **MFA** (TOTP/SMS)
  - Built-in audit logging and triggers for traceability  

### FRONTEND (Web Applications)
- **Framework**: Next.js 15 (App Router, TypeScript, Server Components)
- **Data Layer**: TanStack Query for data fetching & caching  
- **State Management**: Zustand for UI and session control  
- **Forms & Validation**: React Hook Form + Zod  
- **UI**: Tailwind CSS + Shadcn/ui (accessible, themeable components)
- **Integration**: Supabase JS Client for direct DB and Auth API calls  
- **Deployment**: Vercel (auto-deploy, Edge CDN, environment secrets)
- **Auth Flows**: Supabase Auth + optional NextAuth extensions  
- **Performance**: SSR/ISR + Vercel Edge Caching  

### MOBILE (Flutter)

A fully native **Flutter-based mobile suite** for residents, administrators, and security staff.  
Built with **Dart 3+**, it leverages **Supabase Flutter SDK** for seamless integration and real-time operations.

#### Framework & Core Setup
- **Framework**: Flutter (Dart 3+)
- **Auth/Database**: `supabase_flutter` SDK  
- **State Management**: Riverpod or Bloc (depending on feature complexity)  
- **Routing**: `go_router` for declarative navigation  
- **Offline Support**: `hive` or `drift` for local data caching  
- **Realtime**: Supabase Realtime Streams for gate logs, incidents, and announcements  

#### UI & Theming
- **Design System**: Material 3 + custom HOA theme per tenant  
- **Responsive Layout**: Adaptive for phones and tablets  
- **Brand Customization**: Tenant-specific colors, logos, and typography  
- **Dark Mode**: Supported out-of-the-box  

#### Integrations & Features
- **QR Scanning & Generation** → `mobile_scanner`, `qr_flutter`  
- **Push Notifications** → `flutter_local_notifications`, Supabase or Firebase messaging  
- **Payments** → `flutter_stripe` (for dues, permits, and services)  
- **File Uploads** → `file_picker`, `image_picker` integrated with Supabase Storage  
- **Maps & Directions** → Google Maps Flutter plugin for visitor navigation  
- **Security Mode** → Role-specific restricted views and quick-action panels for guards  

#### Deployment
- **Build Pipeline**: Fastlane (CI/CD automation)
- **Release Channels**: Play Console (Android), App Store Connect (iOS)
- **Testing**: Flutter Test + Integration Tests (via `flutter_test` and `integration_test`)
- **Monitoring**: Sentry + Supabase Logs  

> The Flutter app will be **progressively released** per user role — starting with the **Residence App**, followed by **Sentinel** (security) and **Admin Mobile Companion**.

---

## 🔐 AUTHENTICATION & SECURITY
- Supabase Auth for login, JWT rotation, and RBAC
- **Roles**: Superadmin, Admin Head, Admin Officer, Resident, Security Head, Security Officer
- Tenant-level RLS policies ensure strict data isolation per community
- MFA (optional) for sensitive accounts
- Email or Magic Link login for residents and staff
- Audit triggers log all key actions (approvals, gate events, file uploads)

---

## 🧱 DATABASE & DATA MODEL
- PostgreSQL (Supabase) schema includes:
  - Tenants (communities)
  - Users and roles
  - Households, members, beneficial users
  - Gates and access logs
  - Construction permits, payments
  - Announcements and notifications
- **RLS policies** isolate tenant data  
- **Views** provide analytics for activity and population reports  
- **Triggers** maintain audit logs  
- **Realtime subscriptions** stream gate activity and incident updates  

---

## ☁️ INFRASTRUCTURE & DEPLOYMENT
- **Backend**: Supabase (DB, functions, storage, auth)
- **Frontend (Web)**: Vercel (Next.js auto-deploy)
- **Mobile (Flutter)**: Fastlane + Store releases
- **Monitoring**: Supabase Insights + Vercel Analytics + Sentry  
- **CI/CD**: GitHub Actions (lint → test → build → deploy)
- **Caching**: TanStack Query + Vercel Edge Cache
- **CDN & DNS**: Cloudflare

---

## 🔌 INTEGRATIONS
- **Stripe** → community dues, permit payments  
- **Twilio / Supabase Functions** → SMS notifications  
- **SendGrid / Resend** → email alerts and onboarding  
- **Cloudflare** → security and DDoS protection  

---

## 🧪 TESTING & QUALITY
- **Vitest** → unit/integration tests (web)  
- **Playwright** → end-to-end UI tests (web)  
- **Flutter Test / Integration Test** → mobile testing  
- **Mock Service Worker (MSW)** → API mocking for local development  
- **Zod** → shared validation between frontend and backend  

---

## 💻 DEVELOPMENT WORKFLOW
- Git Feature Branch Workflow + Pull Request Reviews  
- Conventional Commits & SemVer  
- ESLint + Prettier + Husky (pre-commit checks)  
- OpenAPI schemas auto-generated from Supabase introspection  
- Automated changelogs via Conventional Commits  

---

## 🧭 APPLICATIONS

| App | Platform | Users | Purpose |
|-----|-----------|--------|----------|
| **Platform App (Web)** | Next.js | Superadmins | Global tenant and platform configuration |
| **Admin App (Web)** | Next.js | Admin-Heads, Admin-Officers | Community-level management (households, passes, elections) |
| **Residence App (Flutter)** | Mobile | Household-Heads, Members, Beneficial Users | Resident portal for passes, permits, guests |
| **Sentinel App (Flutter)** | Mobile | Security-Heads, Security-Officers | Gate monitoring, visitor validation, incident logging |

Each application is maintained as an **independent repository** and integrated into the main **Village Tech Monorepo** using **Git submodules**.  
This allows isolated versioning, modular deployment, and parallel development while maintaining centralized CI/CD and Supabase schema control.

Each app will have **phased development** (Setup → Core Features → Realtime → Reporting), with clear subtasks per feature milestone.

---
## 🧩 SUBMODULE ARCHITECTURE

Village Tech follows a **Git submodule architecture** for modular development and deployment.

## 🔄 CORE OPERATIONS

### A. Community Governance
- Tenant-specific elections, policy management, and admin hierarchy  
- Transparent records of officer terms and activities  

### B. Household & Resident Management
- Household creation and role assignment  
- Resident and beneficial user records  
- Linked passes and construction permits  

### C. Gate & Access Control
- QR code and sticker validation  
- Real-time logging of entries/exits  
- Realtime synchronization across devices  

### D. Construction & Permits
- Permit request, approval, and payment workflow  
- Temporary worker and contractor passes  

### E. Guest Management
- Scheduled visits with auto-expiring QR codes  
- Admin and security visibility on guest lists  

### F. Announcements & Communication
- Push/email/SMS announcements  
- Realtime notifications for alerts and events  

### G. Security & Monitoring
- Gate logs, visitor records, incident reports  
- Realtime alerts for gate activities  
- Role-based access to reports and audit history  

---

## 🌍 MULTI-TENANT STRUCTURE

Each **residential community** is a **tenant** with:
- Its own users, gates, and records  
- Isolated data via RLS policies  
- Custom branding and settings  

A **Superadmin** oversees all tenants globally.

---

## 🎯 CORE VISION

To transform residential community management into a **secure, digital ecosystem** connecting residents, administrators, and security — with transparency, accountability, and real-time insight.