# Tasks: Residential Community Management Platform - Multi-Tenant Foundation

**Input**: Design documents from `/specs/001-residential-community-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Tests**: No explicit test requirements found in specification. Test tasks are NOT included. Add tests if/when requested.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions
This is a multi-platform monorepo with:
- **Platform Web App**: `apps/platform/`
- **Admin Web App**: `apps/admin/`
- **Residence Mobile App**: `apps/residence/`
- **Sentinel Mobile App**: `apps/sentinel/`
- **Supabase Backend**: `supabase/` (migrations, functions, config)
- **Shared Packages**: `packages/` (types, UI components)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and monorepo structure

- [X] T001 [P] Create monorepo structure with apps/, packages/, supabase/, docs/, .github/ directories
- [X] T002 [P] Initialize root package.json with workspace configuration for npm workspaces
- [X] T003 [P] Configure ESLint + Prettier for web apps with shared config in root
- [X] T004 [P] Setup TypeScript configuration with path aliases for monorepo
- [X] T005 [P] Create Platform web app using `npx create-next-app@latest apps/platform --typescript --tailwind --app --use-npm`
- [X] T006 [P] Create Admin web app using `npx create-next-app@latest apps/admin --typescript --tailwind --app --use-npm`
- [X] T007 [P] Create Residence mobile app using `flutter create apps/residence --org com.villagetech --project-name residence`
- [X] T008 [P] Create Sentinel mobile app using `flutter create apps/sentinel --org com.villagetech --project-name sentinel`
- [X] T009 [P] Initialize Supabase project using `supabase init` in repository root
- [X] T010 [P] Setup GitHub Actions workflows in .github/workflows/ (platform-deploy.yml, admin-deploy.yml, residence-build.yml, sentinel-build.yml)
- [X] T011 [P] Create shared TypeScript types package in packages/database-types/ with package.json
- [X] T012 [P] Configure Dart analyzer and linting for Flutter apps (analysis_options.yaml in each mobile app)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Foundation

- [X] T013 Create Supabase migration 00001_create_tenants.sql in supabase/migrations/ (tenants table with subdomain, name, legal_name, community_type, total_residences, branding config, subscription limits, status, timestamps)
- [X] T014 Create Supabase migration 00002_create_users_and_roles.sql in supabase/migrations/ (user_profiles table linked to auth.users with tenant_id, role, first_name, last_name, phone, department, permissions JSON, status, timestamps; enable RLS)
- [X] T015 Create Supabase migration 00003_create_properties.sql in supabase/migrations/ (properties table with tenant_id, address, hierarchy JSON for phase/block/street/lot, attributes JSON for size/bedrooms/parking, occupancy_status, timestamps; enable RLS)
- [X] T016 Create Supabase migration 00004_create_gates.sql in supabase/migrations/ (gates table with tenant_id, name, gate_type, operational_status, operating_hours JSON, gps_coordinates POINT, rfid_reader_serial, timestamps; enable RLS)
- [X] T017 Create Supabase migration 00005_create_rls_policies.sql in supabase/migrations/ (RLS policies for tenants, user_profiles, properties, gates using auth.jwt() ->> 'tenant_id' for tenant isolation)
- [X] T018 Create database trigger function handle_new_user() in 00002_create_users_and_roles.sql to auto-create user_profiles record when auth.users row is inserted (extract tenant_id and role from raw_user_meta_data)

### Authentication & Session Management

- [X] T019 [P] Create Supabase client factory for Platform app in apps/platform/src/lib/supabase/client.ts (browser client with createBrowserClient)
- [X] T020 [P] Create Supabase server client for Platform app in apps/platform/src/lib/supabase/server.ts (server component support with cookies)
- [X] T021 [P] Create Supabase client factory for Admin app in apps/admin/src/lib/supabase/client.ts
- [X] T022 [P] Create Supabase server client for Admin app in apps/admin/src/lib/supabase/server.ts
- [X] T023 [P] Initialize Supabase client for Residence app in apps/residence/lib/core/supabase/supabase_client.dart using supabase_flutter package
- [X] T024 [P] Initialize Supabase client for Sentinel app in apps/sentinel/lib/core/supabase/supabase_client.dart using supabase_flutter package
- [X] T025 [P] Create authentication middleware for Platform app in apps/platform/src/middleware.ts (verify JWT, check superadmin role)
- [X] T026 [P] Create authentication middleware for Admin app in apps/admin/src/middleware.ts (verify JWT, check admin role, enforce tenant isolation)

### UI Framework Setup

- [X] T027 [P] Initialize Shadcn/ui for Platform app using `npx shadcn-ui@latest init` in apps/platform/ (configure components.json)
- [X] T028 [P] Install Shadcn/ui core components for Platform app: button, card, form, input, table, dialog, select, badge, toast
- [X] T029 [P] Initialize Shadcn/ui for Admin app using `npx shadcn-ui@latest init` in apps/admin/
- [X] T030 [P] Install Shadcn/ui core components for Admin app: button, card, form, input, table, dialog, select, badge, toast, calendar, dropdown-menu
- [X] T031 [P] Configure Material 3 theme for Residence app in apps/residence/lib/core/theme/app_theme.dart (light and dark themes with ColorScheme)
- [X] T032 [P] Configure Material 3 theme for Sentinel app in apps/sentinel/lib/core/theme/app_theme.dart (custom security-focused color scheme)

### State Management & Routing

- [X] T033 [P] Install and configure TanStack Query for Platform app in apps/platform/src/lib/react-query/query-client.ts
- [X] T034 [P] Install and configure Zustand for session state in Platform app in apps/platform/src/lib/store/session-store.ts
- [X] T035 [P] Install and configure TanStack Query for Admin app in apps/admin/src/lib/react-query/query-client.ts
- [X] T036 [P] Install and configure Zustand for session state in Admin app in apps/admin/src/lib/store/session-store.ts
- [X] T037 [P] Setup go_router for Residence app in apps/residence/lib/core/routing/app_router.dart (define routes for auth, household, stickers, permits, guests, announcements)
- [X] T038 [P] Setup go_router for Sentinel app in apps/sentinel/lib/core/routing/app_router.dart (define routes for auth, gate_scanning, residents, guests, deliveries, permits, incidents)
- [X] T039 [P] Setup Riverpod providers for Residence app in apps/residence/lib/core/providers/providers.dart (Supabase client provider, auth state provider)
- [X] T040 [P] Setup Bloc architecture for Sentinel app in apps/sentinel/lib/core/bloc/ (create base BlocObserver for logging)

### Offline Support (Sentinel Only)

- [X] T041 Initialize Hive for Sentinel app in apps/sentinel/lib/core/offline/hive_config.dart (configure boxes for cached_stickers, gate_config)
- [X] T042 Create Drift database for Sentinel app in apps/sentinel/lib/core/offline/database.dart (define offline_entry_logs table with synced boolean)
- [X] T043 Create sync service for Sentinel app in apps/sentinel/lib/core/offline/sync_service.dart (batch sync offline logs via Edge Function when connectivity restored)

### Type Generation & Validation

- [X] T044 [P] Generate TypeScript types from Supabase schema using `supabase gen types typescript` → packages/database-types/supabase.ts
- [X] T045 [P] Generate Dart types from Supabase schema (manual creation or use supabase_flutter type generator) → packages/database-types/lib/supabase_types.dart
- [X] T046 [P] Create Zod validation schemas for Platform app in apps/platform/src/lib/validation/schemas.ts (tenant creation, property import)
- [X] T047 [P] Create Zod validation schemas for Admin app in apps/admin/src/lib/validation/schemas.ts (household creation, sticker approval, permit approval)

### Error Handling & Logging

- [X] T048 [P] Create error handling utilities for Platform app in apps/platform/src/lib/utils/errors.ts (standardized error messages, API error parser)
- [X] T049 [P] Create error handling utilities for Admin app in apps/admin/src/lib/utils/errors.ts
- [X] T050 [P] Create error handling utilities for Residence app in apps/residence/lib/core/utils/error_handler.dart
- [X] T051 [P] Create error handling utilities for Sentinel app in apps/sentinel/lib/core/utils/error_handler.dart
- [X] T052 [P] Setup logging for Edge Functions using Deno console standards in supabase/functions/_shared/logger.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Superadmin Creates New Community Tenant (Priority: P1) 🎯 MVP

**Goal**: Enable platform superadmin to onboard new residential communities with complete tenant provisioning, property setup, gate configuration, and admin user creation

**Independent Test**: Create a complete tenant from scratch with 100 properties, 3 gates, and admin user. Verify tenant isolation, subdomain access, admin credentials delivery, and tenant appears in superadmin dashboard.

### Backend for User Story 1

- [X] T053 [P] [US1] Create Edge Function create-tenant in supabase/functions/create-tenant/index.ts (accepts tenant data, properties, gates, admin user; provisions tenant, inserts records, sends activation email; returns tenant_id and status)
- [X] T054 [P] [US1] Create utility function for subdomain validation in supabase/functions/_shared/subdomain-validator.ts (check uniqueness, format, reserved words)
- [X] T055 [P] [US1] Create email template service in supabase/functions/_shared/email-templates.ts (admin activation email with credentials and portal link)

### Platform Web App for User Story 1

- [X] T056 [US1] Create authentication flow for superadmin users in apps/platform/src/app/(auth)/login/page.tsx (email/password login with Supabase Auth, password reset, MFA support for superadmins)
- [X] T057 [US1] Create session hook for superadmin users in apps/platform/src/hooks/use-superadmin-session.ts (fetch user profile, verify superadmin role using TanStack Query)
- [X] T058 [US1] Create platform portal layout in apps/platform/src/app/layout.tsx (Shadcn layout with sidebar navigation for tenants, analytics, settings)
- [X] T059 [US1] Create platform dashboard page in apps/platform/src/app/(dashboard)/page.tsx (overview cards: total tenants, total residents, system health, revenue metrics)
- [X] T060 [US1] Create tenant creation page in apps/platform/src/app/(dashboard)/tenants/create/page.tsx (multi-step wizard UI with Shadcn form components)
- [X] T061 [US1] Create tenant creation form component in apps/platform/src/components/tenants/TenantCreationForm.tsx (step 1: basic info with subdomain, name, community type, max residences)
- [X] T062 [US1] Create property import form component in apps/platform/src/components/tenants/PropertyImportForm.tsx (step 2: CSV upload, validation, preview, error display for bulk property import)
- [X] T063 [US1] Create gate configuration form component in apps/platform/src/components/tenants/GateConfigForm.tsx (step 3: add gates with name, type, operating hours, RFID reader serial)
- [X] T064 [US1] Create admin user setup form component in apps/platform/src/components/tenants/AdminUserForm.tsx (step 4: admin head email, name, phone, department)
- [X] T065 [US1] Create tenant creation action in apps/platform/src/lib/actions/create-tenant.ts (server action that calls Edge Function, handles errors, returns result)
- [X] T066 [US1] Create CSV parser utility for property import in apps/platform/src/lib/utils/csv-parser.ts (parse, validate, detect duplicates, format errors)
- [X] T067 [US1] Create tenant list page in apps/platform/src/app/(dashboard)/tenants/page.tsx (display all tenants with search, filter by status, pagination)
- [X] T068 [US1] Create tenant list component in apps/platform/src/components/tenants/TenantList.tsx (table with tenant name, subdomain, properties count, admin head, status, actions)
- [X] T069 [US1] Create tenant detail page in apps/platform/src/app/(dashboard)/tenants/[id]/page.tsx (view tenant info, properties, gates, admin users, subscription limits)
- [X] T070 [US1] Create tenant edit page in apps/platform/src/app/(dashboard)/tenants/[id]/edit/page.tsx (form to update tenant basic info, subscription limits, settings)
- [X] T071 [US1] Create tenant branding page in apps/platform/src/app/(dashboard)/tenants/[id]/branding/page.tsx (logo upload to Supabase Storage, color scheme picker, theme customization)

### Admin Web App Foundation for User Story 1

- [X] T072 [US1] Create admin portal layout in apps/admin/src/app/layout.tsx (Shadcn layout with sidebar navigation for households, approvals, announcements, fees, settings)
- [X] T073 [US1] Create admin dashboard page in apps/admin/src/app/(dashboard)/page.tsx (overview cards: total households, pending approvals, active permits, announcements, gate activity)
- [X] T074 [US1] Create authentication flow for admin users in apps/admin/src/app/(auth)/login/page.tsx (email/password login with Supabase Auth, password reset, MFA support)
- [X] T075 [US1] Create session hook for admin users in apps/admin/src/hooks/use-admin-session.ts (fetch user profile, role, permissions, tenant config using TanStack Query)

**Checkpoint**: At this point, User Story 1 should be fully functional - superadmin can create tenants and admin heads can access their portals

---

## Phase 4: User Story 2 - Admin Head Sets Up Households and Issues Vehicle Stickers (Priority: P2)

**Goal**: Enable admin head to register households, create household head accounts, and approve vehicle sticker requests to enable resident access

**Independent Test**: Assign multiple households to properties, verify household heads receive login credentials, residents request vehicle stickers, admin approves stickers, and stickers are linked to RFID serials for gate scanning.

### Backend for User Story 2

- [X] T076 Create Supabase migration 00006_create_households.sql in supabase/migrations/ (households table with tenant_id, property_id, household_head_id FK to user_profiles, move_in_date, ownership_type, sticker_allocation, status, timestamps; enable RLS)
- [X] T077 Create Supabase migration 00007_create_household_members.sql in supabase/migrations/ (household_members table with household_id, user_id FK, role, relationship, is_adult, timestamps; enable RLS)
- [X] T078 Create Supabase migration 00008_create_vehicle_stickers.sql in supabase/migrations/ (vehicle_stickers table with household_id, vehicle_plate, vehicle_make, vehicle_model, vehicle_color, sticker_type, rfid_serial UNIQUE, status, expiration_date, or_cr_document_url, timestamps; enable RLS)
- [X] T079 [P] [US2] Create Edge Function approve-sticker in supabase/functions/approve-sticker/index.ts (accepts sticker_id, admin_id, approval decision; updates status, sends notification to household; returns updated sticker)
- [X] T080 [P] [US2] Create household onboarding service in apps/admin/src/lib/services/household-service.ts (create household, assign to property, create household head user with credentials, send welcome email)

### Admin Web App for User Story 2

- [X] T081 [US2] Create households list page in apps/admin/src/app/(dashboard)/households/page.tsx (table with all households, search by address/name, filter by status, pagination)
- [X] T082 [US2] Create household creation page in apps/admin/src/app/(dashboard)/households/create/page.tsx (form to select property, enter household head info, set ownership type, sticker allocation)
- [X] T083 [US2] Create household creation form component in apps/admin/src/components/households/HouseholdForm.tsx (property selector, household head fields, ownership type dropdown, sticker allocation input)
- [ ] T084 [US2] Create household bulk import page in apps/admin/src/app/(dashboard)/households/import/page.tsx (CSV upload, preview, validation, batch processing with progress tracking)
- [X] T085 [US2] Create household detail page in apps/admin/src/app/(dashboard)/households/[id]/page.tsx (view household info, members, stickers, permits, guests, fees)
- [X] T086 [US2] Create vehicle sticker approvals page in apps/admin/src/app/(dashboard)/approvals/stickers/page.tsx (list pending sticker requests with household info, vehicle details, documents)
- [X] T087 [US2] Create sticker approval component in apps/admin/src/components/approvals/StickerApprovalCard.tsx (display request details, document preview, approve/reject actions)
- [X] T088 [US2] Create sticker list for household in apps/admin/src/components/households/HouseholdStickerList.tsx (table showing all stickers for a household with status, RFID serial, expiration)
- [X] T089 [US2] Create action to approve/reject sticker in apps/admin/src/lib/actions/approve-sticker.ts (call Edge Function, handle response, invalidate queries)

### Residence Mobile App Foundation for User Story 2

- [ ] T090 [US2] Create authentication flow for Residence app in apps/residence/lib/features/auth/screens/login_screen.dart (email/password login, magic link support, password reset)
- [ ] T091 [US2] Create auth provider for Residence app in apps/residence/lib/features/auth/providers/auth_provider.dart (Riverpod provider for Supabase Auth state, user profile)
- [ ] T092 [US2] Create main app layout for Residence app in apps/residence/lib/features/home/screens/home_screen.dart (bottom navigation: household, stickers, permits, guests, announcements)
- [ ] T093 [US2] Create household profile screen in apps/residence/lib/features/household/screens/household_profile_screen.dart (display household info, property address, members, contact)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - admin can create households and manage stickers

---

## Phase 5: User Story 3 - Household Manages Family and Requests Services (Priority: P3)

**Goal**: Enable household heads to add family members, register beneficial users, request construction permits, and schedule guest visits for self-service household management

**Independent Test**: Log in as household head, add family members with app invitations, request vehicle stickers, pre-register guests, submit construction permits, and verify all requests flow to admin for approval.

### Backend for User Story 3

- [ ] T093 Create Supabase migration 00009_create_beneficial_users.sql in supabase/migrations/ (beneficial_users table with household_id, name, role, government_id_url, vehicle_plate, status, timestamps; enable RLS)
- [ ] T094 Create Supabase migration 00010_create_guests.sql in supabase/migrations/ (guests table with household_id, guest_name, phone_number, vehicle_plate, visit_type, visit_date, expected_arrival_time, status, approved_by_household BOOLEAN, timestamps; enable RLS)
- [ ] T095 Create Supabase migration 00011_create_construction_permits.sql in supabase/migrations/ (construction_permits table with household_id, project_type, description, start_date, duration_days, contractor_name, contractor_license_url, num_workers, worker_list JSON, road_fee_amount, payment_status, permit_status, approved_by_admin_id FK, timestamps; enable RLS)
- [ ] T096 [P] [US3] Create Edge Function approve-permit in supabase/functions/approve-permit/index.ts (accepts permit_id, admin_id, road_fee_amount; updates status, generates invoice, sends notification; returns updated permit)

### Residence Mobile App for User Story 3

- [ ] T097 [US3] Create household members list screen in apps/residence/lib/features/household/screens/members_screen.dart (display all members with roles, add member button, invite adult members)
- [ ] T098 [US3] Create add member form screen in apps/residence/lib/features/household/screens/add_member_screen.dart (form for name, role, relationship, is_adult, contact info)
- [ ] T099 [US3] Create member provider for Residence app in apps/residence/lib/features/household/providers/member_provider.dart (Riverpod FutureProvider to fetch members, AsyncNotifier to add/update members)
- [ ] T100 [US3] Create vehicle stickers screen in apps/residence/lib/features/stickers/screens/stickers_screen.dart (list all household stickers with status, request new sticker button)
- [ ] T101 [US3] Create sticker request form screen in apps/residence/lib/features/stickers/screens/request_sticker_screen.dart (form for vehicle plate, make, model, color, sticker type, document upload to Supabase Storage)
- [ ] T102 [US3] Create sticker provider for Residence app in apps/residence/lib/features/stickers/providers/sticker_provider.dart (FutureProvider to fetch stickers, AsyncNotifier to request sticker)
- [ ] T103 [US3] Create guests list screen in apps/residence/lib/features/guests/screens/guests_screen.dart (list pre-registered guests, filter by upcoming/past, add guest button)
- [ ] T104 [US3] Create guest registration form screen in apps/residence/lib/features/guests/screens/register_guest_screen.dart (form for guest name, phone, vehicle plate, visit type, visit date, arrival time)
- [ ] T105 [US3] Create guest provider for Residence app in apps/residence/lib/features/guests/providers/guest_provider.dart (FutureProvider to fetch guests, AsyncNotifier to register/update guest)
- [ ] T106 [US3] Create construction permits screen in apps/residence/lib/features/permits/screens/permits_screen.dart (list all permits with status, request new permit button)
- [ ] T107 [US3] Create permit request form screen in apps/residence/lib/features/permits/screens/request_permit_screen.dart (multi-step form: project details, contractor info, worker list, document uploads)
- [ ] T108 [US3] Create permit provider for Residence app in apps/residence/lib/features/permits/providers/permit_provider.dart (FutureProvider to fetch permits, AsyncNotifier to request permit)
- [ ] T109 [US3] Create Stripe payment screen for permits in apps/residence/lib/features/permits/screens/permit_payment_screen.dart (display invoice, integrate flutter_stripe for payment, confirm payment)

### Admin Web App for User Story 3

- [ ] T110 [US3] Create construction permit approvals page in apps/admin/src/app/(dashboard)/approvals/permits/page.tsx (list pending permit requests with household, project details, contractor info, documents)
- [ ] T111 [US3] Create permit approval component in apps/admin/src/components/approvals/PermitApprovalCard.tsx (display request details, calculate road fee, approve/reject actions)
- [ ] T112 [US3] Create action to approve/reject permit in apps/admin/src/lib/actions/approve-permit.ts (call Edge Function, handle payment processing, invalidate queries)

**Checkpoint**: All basic household services should now be independently functional - households can self-manage and request services

---

## Phase 6: User Story 4 - Security Officer Manages Gate Entry/Exit (Priority: P4)

**Goal**: Enable gate guards to scan resident RFID stickers, verify pre-registered guests, approve walk-in visitors, monitor deliveries, validate construction workers, and log all entry/exit activity with offline support

**Independent Test**: Simulate various entry scenarios (resident with sticker, pre-registered guest, unregistered visitor, delivery, construction worker) on Sentinel app and verify all are properly logged, tracked, and synced when offline.

### Backend for User Story 4

- [ ] T113 Create Supabase migration 00012_create_entry_exit_logs.sql in supabase/migrations/ (entry_exit_logs table with gate_id, tenant_id, entry_type, sticker_id FK, guest_id FK, permit_id FK, direction, timestamp, guard_on_duty_id FK, vehicle_plate, purpose, notes; enable RLS; add indexes on gate_id, timestamp)
- [ ] T114 Create Supabase migration 00013_create_deliveries.sql in supabase/migrations/ (deliveries table with household_id, guest_id FK, delivery_company, driver_name, vehicle_plate, package_description, household_response, entry_log_id FK, exit_log_id FK, hold_location, status, timestamps; enable RLS)
- [ ] T115 Create Supabase migration 00014_create_guest_approval_requests.sql in supabase/migrations/ (guest_approval_requests table with household_id, guest_name, vehicle_plate, gate_id, requested_by_guard_id FK, status, response, timeout_at TIMESTAMP, responded_at, timestamps; enable RLS for realtime subscriptions)
- [ ] T116 [P] [US4] Create Edge Function request-guest-approval in supabase/functions/request-guest-approval/index.ts (accepts household_id, guest_name, vehicle_plate, gate_id; creates approval request, sends push notification to household; returns request_id and timeout)
- [ ] T117 [P] [US4] Create Edge Function sync-offline-logs in supabase/functions/sync-offline-logs/index.ts (accepts batch of entry_exit_logs from Sentinel app; validates, deduplicates, inserts logs; returns sync status)

### Sentinel Mobile App for User Story 4

- [ ] T118 [US4] Create authentication flow for Sentinel app in apps/sentinel/lib/features/auth/screens/login_screen.dart (email/password login for security officers with role validation)
- [ ] T119 [US4] Create auth bloc for Sentinel app in apps/sentinel/lib/features/auth/blocs/auth_bloc.dart (manage auth state, user profile, gate assignment using Bloc pattern)
- [ ] T120 [US4] Create main app layout for Sentinel app in apps/sentinel/lib/features/home/screens/home_screen.dart (bottom navigation: gate scanning, residents, guests, deliveries, permits, incidents)
- [ ] T121 [US4] Create gate selection screen in apps/sentinel/lib/features/gate_scanning/screens/gate_selection_screen.dart (select active gate for shift, display gate info, operating hours)
- [ ] T122 [US4] Create RFID scanning screen in apps/sentinel/lib/features/gate_scanning/screens/rfid_scan_screen.dart (scan RFID sticker, display resident info, auto-log entry, manual barrier control)
- [ ] T123 [US4] Create gate scan bloc for Sentinel app in apps/sentinel/lib/features/gate_scanning/blocs/gate_scan_bloc.dart (handle RFID scan events, validate sticker, check offline cache, log entry, emit success/error states)
- [ ] T124 [US4] Create offline cache service for Sentinel in apps/sentinel/lib/core/offline/cache_service.dart (cache valid stickers in Hive, sync hourly, provide offline lookup)
- [ ] T125 [US4] Create entry log repository for Sentinel in apps/sentinel/lib/features/gate_scanning/repositories/entry_log_repository.dart (insert log to Drift if offline, sync to Supabase when online)
- [ ] T126 [US4] Create resident verification screen in apps/sentinel/lib/features/residents/screens/resident_search_screen.dart (search residents by name/address/plate, display household info, vehicle stickers)
- [ ] T127 [US4] Create pre-registered guests screen in apps/sentinel/lib/features/guests/screens/guests_screen.dart (list today's expected guests, search by name/plate, check-in action)
- [ ] T128 [US4] Create guest check-in screen in apps/sentinel/lib/features/guests/screens/guest_checkin_screen.dart (verify guest ID, take photo, log entry, send arrival notification to household)
- [ ] T129 [US4] Create walk-in visitor approval screen in apps/sentinel/lib/features/guests/screens/visitor_approval_screen.dart (enter visitor details, request household approval, display realtime response with 2-minute timeout)
- [ ] T130 [US4] Create guest approval bloc for Sentinel in apps/sentinel/lib/features/guests/blocs/guest_approval_bloc.dart (call Edge Function, subscribe to approval_requests realtime channel, handle approve/reject/timeout events)
- [ ] T131 [US4] Create delivery management screen in apps/sentinel/lib/features/deliveries/screens/deliveries_screen.dart (log delivery arrival, notify household, track duration, alert on overstay > 30 min)
- [ ] T132 [US4] Create delivery check-in form screen in apps/sentinel/lib/features/deliveries/screens/delivery_checkin_screen.dart (delivery company, driver name, vehicle plate, package description, household notification)
- [ ] T133 [US4] Create construction worker verification screen in apps/sentinel/lib/features/permits/screens/worker_verification_screen.dart (search active permits by address, verify worker IDs against registered list, log entry with photo)
- [ ] T134 [US4] Create permit verification bloc for Sentinel in apps/sentinel/lib/features/permits/blocs/permit_verification_bloc.dart (fetch active permits, validate worker IDs, check permit expiration, log worker entry)

### Residence Mobile App for User Story 4 (Realtime Approvals)

- [ ] T135 [US4] Create guest approval notification handler in apps/residence/lib/features/guests/providers/approval_provider.dart (subscribe to guest_approval_requests realtime channel, show push notification)
- [ ] T136 [US4] Create guest approval dialog in apps/residence/lib/features/guests/widgets/guest_approval_dialog.dart (display visitor info, approve/reject buttons, timeout countdown)
- [ ] T137 [US4] Setup push notifications for Residence app in apps/residence/lib/core/notifications/notification_service.dart (configure flutter_local_notifications, handle foreground/background notifications)

**Checkpoint**: All gate operations should now be fully functional with offline support - security can manage all entry types

---

## Phase 7: User Story 5 - Admin Communicates and Monitors Community (Priority: P5)

**Goal**: Enable admin head/officers to send announcements, monitor gate activity, review incident reports, manage association fees, and maintain community rules

**Independent Test**: Create announcements with different urgency levels and audiences, track read receipts, review entry logs and incident reports, generate fee invoices, and verify all communications reach intended recipients.

### Backend for User Story 5

- [ ] T138 Create Supabase migration 00015_create_announcements.sql in supabase/migrations/ (announcements table with tenant_id, created_by_admin_id FK, title, content TEXT, urgency, category, target_audience, effective_start, effective_end, requires_acknowledgment BOOLEAN, attachment_urls JSON, timestamps; enable RLS)
- [ ] T139 Create Supabase migration 00016_create_announcement_reads.sql in supabase/migrations/ (announcement_reads table with announcement_id FK, user_id FK, read_at, acknowledged_at; enable RLS; unique constraint on announcement_id + user_id)
- [ ] T140 Create Supabase migration 00017_create_village_rules.sql in supabase/migrations/ (village_rules table with tenant_id, category, title, description TEXT, version, effective_date, created_by_admin_id FK, published_at, timestamps; enable RLS)
- [ ] T141 Create Supabase migration 00018_create_association_fees.sql in supabase/migrations/ (association_fees table with tenant_id, household_id FK, fee_structure, amount, due_date, payment_status, paid_at, payment_reference, invoice_url, receipt_url, late_fee_amount, timestamps; enable RLS)
- [ ] T142 Create Supabase migration 00019_create_incidents.sql in supabase/migrations/ (incidents table with tenant_id, gate_id FK, reported_by_guard_id FK, incident_type, location, severity, description TEXT, photo_urls JSON, video_urls JSON, involved_parties JSON, resolution_status, resolved_by_admin_id FK, resolved_at, timestamps; enable RLS)
- [ ] T143 [P] [US5] Create Edge Function send-announcement in supabase/functions/send-announcement/index.ts (accepts announcement data; creates announcement record, filters recipients by target_audience, sends push notifications, emails, SMS for critical; returns announcement_id and recipients_count)
- [ ] T144 [P] [US5] Create Edge Function stripe-webhook in supabase/functions/stripe-webhook/index.ts (handle Stripe payment_intent.succeeded event; update association_fees payment_status, generate receipt, send confirmation email)

### Admin Web App for User Story 5

- [ ] T145 [US5] Create announcements list page in apps/admin/src/app/(dashboard)/announcements/page.tsx (list all announcements, filter by urgency/category, create new announcement button)
- [ ] T146 [US5] Create announcement creation page in apps/admin/src/app/(dashboard)/announcements/create/page.tsx (form for title, rich text content, urgency, category, target audience selection, effective dates, attachments upload)
- [ ] T147 [US5] Create announcement form component in apps/admin/src/components/announcements/AnnouncementForm.tsx (rich text editor with @tiptap/react, audience selector with checkboxes, date pickers)
- [ ] T148 [US5] Create announcement detail page in apps/admin/src/app/(dashboard)/announcements/[id]/page.tsx (view announcement, read/acknowledgment tracking, recipients list)
- [ ] T149 [US5] Create action to send announcement in apps/admin/src/lib/actions/send-announcement.ts (call Edge Function, handle file uploads to Supabase Storage, invalidate queries)
- [ ] T150 [US5] Create village rules page in apps/admin/src/app/(dashboard)/settings/rules/page.tsx (list all rules by category, create/edit/publish rules, version history)
- [ ] T151 [US5] Create rule editor component in apps/admin/src/components/settings/RuleEditor.tsx (category selector, title, rich text description, effective date, publish button)
- [ ] T152 [US5] Create association fees page in apps/admin/src/app/(dashboard)/fees/page.tsx (fee structure configuration, generate invoices for all households, payment tracking table)
- [ ] T153 [US5] Create fee invoice generation component in apps/admin/src/components/fees/InvoiceGenerator.tsx (select billing period, calculate amounts, preview invoices, batch generate with Stripe)
- [ ] T154 [US5] Create fee payment tracking component in apps/admin/src/components/fees/PaymentTracker.tsx (table showing all fees, filter by payment_status, send reminders, apply late fees)
- [ ] T155 [US5] Create gate activity dashboard in apps/admin/src/app/(dashboard)/monitoring/gates/page.tsx (realtime entry/exit logs, charts by hour/day, filter by gate/entry_type)
- [ ] T156 [US5] Create incident reports page in apps/admin/src/app/(dashboard)/monitoring/incidents/page.tsx (list all incidents, filter by severity/status, view details, resolve incidents)
- [ ] T157 [US5] Create incident detail page in apps/admin/src/app/(dashboard)/monitoring/incidents/[id]/page.tsx (view incident details, photos/videos, involved parties, resolution form)
- [ ] T158 [US5] Create action to resolve incident in apps/admin/src/lib/actions/resolve-incident.ts (update incident status, add resolution notes, send notifications)

### Residence Mobile App for User Story 5

- [ ] T159 [US5] Create announcements screen in apps/residence/lib/features/announcements/screens/announcements_screen.dart (list all announcements for household, filter by category/urgency, mark as read)
- [ ] T160 [US5] Create announcement detail screen in apps/residence/lib/features/announcements/screens/announcement_detail_screen.dart (view full content, attachments, acknowledge if required)
- [ ] T161 [US5] Create announcement provider for Residence app in apps/residence/lib/features/announcements/providers/announcement_provider.dart (FutureProvider to fetch announcements, subscribe to realtime announcements channel, update read status)
- [ ] T162 [US5] Create village rules screen in apps/residence/lib/features/announcements/screens/village_rules_screen.dart (list all published rules by category, view rule details)
- [ ] T163 [US5] Create association fees screen in apps/residence/lib/features/fees/screens/fees_screen.dart (list all fees with payment_status, view invoices, pay online button)
- [ ] T164 [US5] Create fee payment screen in apps/residence/lib/features/fees/screens/fee_payment_screen.dart (display invoice details, integrate flutter_stripe for payment, confirm payment)
- [ ] T165 [US5] Create fee provider for Residence app in apps/residence/lib/features/fees/providers/fee_provider.dart (FutureProvider to fetch fees, handle Stripe payment confirmation)

### Sentinel Mobile App for User Story 5

- [ ] T166 [US5] Create incident reporting screen in apps/sentinel/lib/features/incidents/screens/create_incident_screen.dart (form for incident_type, location, severity, description, photo/video capture, involved parties)
- [ ] T167 [US5] Create incident list screen in apps/sentinel/lib/features/incidents/screens/incidents_screen.dart (list incidents reported by guard, view details, track resolution status)
- [ ] T168 [US5] Create incident bloc for Sentinel in apps/sentinel/lib/features/incidents/blocs/incident_bloc.dart (create incident with media upload to Supabase Storage, emit real-time alert to admin)
- [ ] T169 [US5] Create announcements for security screen in apps/sentinel/lib/features/announcements/screens/announcements_screen.dart (list announcements targeted to security personnel, mark as read)

**Checkpoint**: All communication and monitoring features should now be fully functional across all apps

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final production readiness

- [ ] T170 [P] Add comprehensive error boundaries to Platform app in apps/platform/src/app/error.tsx (global error page with retry, logging to Sentry)
- [ ] T171 [P] Add comprehensive error boundaries to Admin app in apps/admin/src/app/error.tsx
- [ ] T172 [P] Add loading states for all async operations in Platform app (Suspense boundaries, skeleton loaders)
- [ ] T173 [P] Add loading states for all async operations in Admin app
- [ ] T174 [P] Add loading states for all async operations in Residence app (CircularProgressIndicator, shimmer effects)
- [ ] T175 [P] Add loading states for all async operations in Sentinel app
- [ ] T176 [P] Implement optimistic updates for critical mutations in Admin app (sticker approval, permit approval using TanStack Query)
- [ ] T177 [P] Implement optimistic updates for critical mutations in Residence app (guest approval, fee payment using Riverpod)
- [ ] T178 [P] Add form validation feedback for all forms in Platform app (inline errors, field-level validation with Zod + React Hook Form)
- [ ] T179 [P] Add form validation feedback for all forms in Admin app
- [ ] T180 [P] Add form validation feedback for all forms in Residence app (Flutter form validators)
- [ ] T181 [P] Add form validation feedback for all forms in Sentinel app
- [ ] T182 [P] Implement accessibility features for Platform app (ARIA labels, keyboard navigation, focus management, WCAG 2.1 AA compliance)
- [ ] T183 [P] Implement accessibility features for Admin app
- [ ] T184 [P] Implement accessibility features for Residence app (Semantics widgets, screen reader support)
- [ ] T185 [P] Implement accessibility features for Sentinel app
- [ ] T186 [P] Add search and filtering utilities across all list views in Admin app (debounced search, multi-select filters)
- [ ] T187 [P] Add pagination for all large tables in Platform app (server-side pagination with Supabase)
- [ ] T188 [P] Add pagination for all large tables in Admin app
- [ ] T189 [P] Setup analytics tracking in Platform app using Vercel Analytics (page views, tenant creation events)
- [ ] T190 [P] Setup analytics tracking in Admin app (dashboard visits, approval actions)
- [ ] T191 [P] Setup analytics tracking in Residence app using Firebase Analytics (feature usage, service requests)
- [ ] T192 [P] Setup analytics tracking in Sentinel app (gate scans, entry types)
- [ ] T193 [P] Implement email service integration using SendGrid/Resend in Edge Functions (welcome emails, invoices, notifications)
- [ ] T194 [P] Implement SMS service integration using Twilio in Edge Functions (critical alerts, 2FA)
- [ ] T195 [P] Create comprehensive README.md in repository root (architecture overview, setup instructions, deployment guides)
- [ ] T196 [P] Create API documentation for Edge Functions in docs/api-reference.md (endpoint specs, request/response examples)
- [ ] T197 [P] Create deployment guide in docs/deployment.md (Vercel setup, Supabase production config, Flutter app store submission)
- [ ] T198 [P] Setup monitoring and alerting using Supabase Insights + Sentry (error tracking, performance monitoring, uptime alerts)
- [ ] T199 [P] Perform security audit of RLS policies in all Supabase migrations (test tenant isolation, permission boundaries)
- [ ] T200 [P] Add rate limiting to critical Edge Functions (create-tenant, sync-offline-logs using Supabase rate limiter)
- [ ] T201 [P] Optimize database queries with indexes in supabase/migrations/00020_add_indexes.sql (add indexes on frequently queried columns: tenant_id, status, timestamps)
- [ ] T202 [P] Add database query performance monitoring using Supabase query insights (identify slow queries, optimize)
- [ ] T203 [P] Create backup and disaster recovery procedures in docs/backup-recovery.md (Supabase automated backups, restoration process)
- [ ] T204 Run quickstart.md validation (verify all setup steps work on fresh environment, test code examples)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion - Can run in parallel with US1 but integrates with admin portal
- **User Story 3 (Phase 5)**: Depends on Foundational + US2 completion (needs households and stickers)
- **User Story 4 (Phase 6)**: Depends on Foundational + US2 + US3 completion (needs all entity data for gate operations)
- **User Story 5 (Phase 7)**: Depends on Foundational completion - Can run in parallel with other stories
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation only - No dependencies on other stories ✅ Independent
- **User Story 2 (P2)**: Needs US1 complete (admin portal foundation) - Integrates with tenant data
- **User Story 3 (P3)**: Needs US2 complete (households must exist) - Integrates with household data
- **User Story 4 (P4)**: Needs US2 + US3 complete (resident data, stickers, guests, permits) - Integrates with all data
- **User Story 5 (P5)**: Foundation only - Can develop in parallel ✅ Independent (except incident monitoring needs gate logs from US4)

### Within Each User Story

- Backend migrations before application code
- Database triggers with migrations
- Edge Functions before frontend actions that call them
- Authentication flows before protected screens
- Models/providers before screens that use them
- Services/repositories before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T001-T012) marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel within their categories (database, auth, UI, state, types, errors)
- Once Foundational phase completes:
  - User Story 1 (Platform + Admin foundation) - Team A
  - User Story 5 (Communication features) - Team B (partially parallel)
- After US1 completes:
  - User Story 2 (Household + Stickers) - Team A
- After US2 completes:
  - User Story 3 (Resident Services) - Team A
- After US3 completes:
  - User Story 4 (Gate Operations) - Team A
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Backend (can run together):
Task T053: "Create Edge Function create-tenant in supabase/functions/create-tenant/index.ts"
Task T054: "Create utility function for subdomain validation in supabase/functions/_shared/subdomain-validator.ts"
Task T055: "Create email template service in supabase/functions/_shared/email-templates.ts"

# Frontend components (can run together after T053-T055):
Task T057: "Create tenant creation form component - step 1 basic info"
Task T058: "Create property import form component - step 2 CSV upload"
Task T059: "Create gate configuration form component - step 3 gates"
Task T060: "Create admin user setup form component - step 4 admin user"
Task T066: "Create branding configuration component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T012)
2. Complete Phase 2: Foundational (T013-T052) - CRITICAL PATH
3. Complete Phase 3: User Story 1 (T053-T070)
4. **STOP and VALIDATE**: Test tenant creation end-to-end, verify admin can access portal
5. Deploy Platform and Admin apps to staging
6. Demo MVP to stakeholders

**MVP Deliverable**: Superadmin can onboard new communities with complete tenant setup. Admin heads can access their dedicated portals.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (T001-T052)
2. Add User Story 1 → Deploy/Demo MVP (T053-T075)
3. Add User Story 2 → Household management live (T076-T093)
4. Add User Story 3 → Resident self-service live (T094-T113)
5. Add User Story 4 → Gate operations live with offline support (T109-T133)
6. Add User Story 5 → Full communication and monitoring (T134-T165)
7. Add Polish → Production ready (T166-T200)

Each user story adds value without breaking previous functionality.

### Parallel Team Strategy

With 3 developers:

1. **All team members**: Complete Setup + Foundational together (T001-T052)
2. Once Foundational is done:
   - **Developer A**: User Story 1 Platform app (T053-T071)
   - **Developer B**: User Story 1 Admin app foundation (T072-T075)
   - **Developer C**: User Story 5 backend migrations (T139-T147) - can work in parallel
3. **Developer A**: User Story 2 Admin app (T081-T089)
4. **Developer B**: User Story 2 Residence app foundation (T090-T093)
5. **Developer A**: User Story 3 Residence app (T093-T105)
6. **Developer B**: User Story 3 Admin app (T106-T108)
7. **Developer C**: User Story 4 Sentinel app (T114-T130)
8. **All team members**: User Story 5 remaining features (T141-T165)
9. **All team members**: Polish tasks in parallel (T166-T200)

---

## Notes

- [P] tasks = different files/apps, can run in parallel
- [Story] label (US1-US5) maps task to specific user story for traceability
- Each user story should be independently testable at its checkpoint
- Foundational phase (Phase 2) is CRITICAL PATH - must complete before any story work begins
- Offline support is critical for Sentinel app - implement cache and sync early (T041-T043)
- RLS policies MUST be tested thoroughly to ensure tenant isolation (T195)
- Edge Functions should handle errors gracefully and return standardized responses
- All file uploads go to Supabase Storage with proper RLS policies
- Push notifications require proper setup in Flutter apps (T133 for Residence, similar for Sentinel)
- Stripe integration requires webhook setup and testing (T140)
- Realtime subscriptions require proper channel management to avoid connection limits
- Commit after each task or logical group of related tasks
- Stop at checkpoints to validate user stories independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Test tenant isolation thoroughly - this is the most critical security requirement
- Ensure all mobile apps handle offline scenarios gracefully
- Validate all forms on both client and server (never trust client-side validation alone)
