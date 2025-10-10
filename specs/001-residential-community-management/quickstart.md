# Quickstart Guide - Residential Community Management Platform

**Feature**: 001-residential-community-management
**Date**: 2025-10-10
**Audience**: Developers implementing the HOA management platform

## Prerequisites

- **Node.js** 18+ and npm
- **Flutter** 3.x and Dart 3+
- **Supabase CLI** (`npm install -g supabase`)
- **Supabase Account** (sign up at [supabase.com](https://supabase.com))
- **Vercel Account** (for Next.js deployment)
- **Git** and GitHub account

---

## Setup Steps

### 1. Initialize Supabase Project

```bash
# Login to Supabase
supabase login

# Initialize local Supabase project
supabase init

# Start local Supabase (Docker required)
supabase start

# Apply migrations
supabase db reset
```

Create migrations in `supabase/migrations/`:
- `00001_create_tenants.sql` - Tenants table
- `00002_create_users_and_roles.sql` - User profiles
- `00003_create_households.sql` - Households, properties, members
- `00004_create_gates_and_stickers.sql` - Gates, stickers, entry logs
- `00005_create_rls_policies.sql` - Row-Level Security policies

### 2. Set Up Web Applications (Platform & Admin)

```bash
# Navigate to monorepo root
cd village-tech-system-v2

# Install dependencies
npm install

# Create Platform app
cd apps/platform
npx create-next-app@latest . --typescript --tailwind --app --use-npm

# Install dependencies
npm install @supabase/supabase-js @tanstack/react-query zustand react-hook-form zod

# Install Shadcn/ui
npx shadcn-ui@latest init

# Add components
npx shadcn-ui@latest add button card form input table

# Create .env.local
cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EOF

# Run development server
npm run dev
```

Repeat for Admin app in `apps/admin/`.

### 3. Set Up Mobile Applications (Residence & Sentinel)

```bash
# Create Residence app
cd apps/residence
flutter create . --org com.villagetech --project-name residence

# Add dependencies to pubspec.yaml
flutter pub add supabase_flutter riverpod go_router hive flutter_dotenv

# Create .env
cat > .env <<EOF
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key
EOF

# Run app
flutter run
```

Repeat for Sentinel app in `apps/sentinel/`.

### 4. Deploy Edge Functions

```bash
# Create Edge Function
supabase functions new create-tenant

# Edit function: supabase/functions/create-tenant/index.ts
# Deploy function
supabase functions deploy create-tenant --no-verify-jwt

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
```

### 5. Configure Authentication

```bash
# Enable email auth in Supabase Dashboard
# Settings > Authentication > Providers > Email (enable)

# Configure custom claims (add trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, tenant_id, role, first_name, last_name)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'tenant_id')::uuid,
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Development Workflow

### Run All Apps Locally

```bash
# Terminal 1: Supabase
supabase start

# Terminal 2: Platform web app
cd apps/platform && npm run dev

# Terminal 3: Admin web app
cd apps/admin && npm run dev

# Terminal 4: Residence mobile app
cd apps/residence && flutter run

# Terminal 5: Sentinel mobile app
cd apps/sentinel && flutter run
```

### Key URLs
- **Platform App**: http://localhost:3000
- **Admin App**: http://localhost:3001
- **Supabase Studio**: http://localhost:54323
- **Supabase API**: http://localhost:54321

---

## Common Operations

### Create a Tenant (Platform App)

```typescript
// apps/platform/src/lib/actions/create-tenant.ts
'use server';

import { createServerClient } from '@/lib/supabase/server';

export async function createTenant(data: {
  name: string;
  subdomain: string;
  adminEmail: string;
  adminName: string;
}) {
  const supabase = createServerClient();

  // Call Edge Function
  const { data: result, error } = await supabase.functions.invoke('create-tenant', {
    body: data,
  });

  if (error) throw error;
  return result;
}
```

### Fetch Households (Admin App)

```typescript
// apps/admin/src/hooks/use-households.ts
import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/client';

export function useHouseholds() {
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('households')
        .select(`
          *,
          property:properties(*),
          household_head:user_profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
```

### Request Sticker (Residence App)

```dart
// apps/residence/lib/features/stickers/providers/sticker_provider.dart
import 'package:riverpod/riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final stickerProvider = FutureProvider.autoDispose<List<VehicleSticker>>((ref) async {
  final supabase = Supabase.instance.client;
  final householdId = ref.watch(currentHouseholdProvider);

  final response = await supabase
      .from('vehicle_stickers')
      .select()
      .eq('household_id', householdId)
      .order('created_at', ascending: false);

  return (response as List).map((e) => VehicleSticker.fromJson(e)).toList();
});

// Request new sticker
Future<void> requestSticker(VehicleSticker sticker) async {
  final supabase = Supabase.instance.client;

  await supabase.from('vehicle_stickers').insert(sticker.toJson());
}
```

### Scan RFID (Sentinel App)

```dart
// apps/sentinel/lib/features/gate_scanning/blocs/scan_bloc.dart
import 'package:bloc/bloc.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class GateScanBloc extends Bloc<GateScanEvent, GateScanState> {
  final SupabaseClient _supabase;

  GateScanBloc(this._supabase) : super(GateScanInitial()) {
    on<ScanRFIDEvent>(_onScanRFID);
  }

  Future<void> _onScanRFID(ScanRFIDEvent event, Emitter<GateScanState> emit) async {
    emit(GateScanLoading());

    try {
      // Find sticker
      final sticker = await _supabase
          .from('vehicle_stickers')
          .select('*, household:households(*)')
          .eq('rfid_serial', event.rfidSerial)
          .single();

      // Validate
      if (sticker['status'] != 'issued') {
        emit(GateScanError('Sticker not active'));
        return;
      }

      // Log entry
      await _supabase.from('entry_exit_logs').insert({
        'gate_id': event.gateId,
        'sticker_id': sticker['id'],
        'entry_type': 'resident',
        'direction': 'entry',
        'guard_on_duty_id': event.guardId,
      });

      emit(GateScanSuccess(sticker));
    } catch (e) {
      emit(GateScanError(e.toString()));
    }
  }
}
```

---

## Testing

### Web Apps (Vitest)

```bash
cd apps/platform
npm run test
```

```typescript
// apps/platform/src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatSubdomain } from './utils';

describe('formatSubdomain', () => {
  it('should convert to lowercase and remove spaces', () => {
    expect(formatSubdomain('Green Field Village')).toBe('green-field-village');
  });
});
```

### Mobile Apps (Flutter Test)

```bash
cd apps/residence
flutter test
```

```dart
// apps/residence/test/features/stickers/sticker_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:residence/features/stickers/models/vehicle_sticker.dart';

void main() {
  group('VehicleSticker', () {
    test('fromJson should parse correctly', () {
      final json = {
        'id': 'uuid',
        'vehicle_plate': 'ABC-1234',
        'status': 'issued',
      };

      final sticker = VehicleSticker.fromJson(json);

      expect(sticker.vehiclePlate, 'ABC-1234');
      expect(sticker.status, StickerStatus.issued);
    });
  });
}
```

---

## Deployment

### Web Apps (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy Platform app
cd apps/platform
vercel --prod

# Set environment variables in Vercel Dashboard
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Mobile Apps (Fastlane)

```bash
# Install Fastlane
sudo gem install fastlane

# Initialize Fastlane
cd apps/residence/android
fastlane init

# Deploy to Play Store (internal track)
fastlane deploy
```

```ruby
# android/fastlane/Fastfile
lane :deploy do
  gradle(task: "clean assembleRelease")
  upload_to_play_store(
    track: 'internal',
    aab: '../build/app/outputs/bundle/release/app-release.aab'
  )
end
```

---

## Troubleshooting

### Common Issues

**1. Supabase RLS blocking requests**
- Ensure JWT contains `tenant_id` and `role` claims
- Check RLS policies in Supabase Studio

**2. Next.js CORS errors**
- Set `NEXT_PUBLIC_SUPABASE_URL` correctly
- Verify Supabase project allows localhost origins

**3. Flutter Supabase connection fails**
- Check `.env` file is loaded (`flutter_dotenv`)
- Verify Supabase URL and anon key

**4. Offline mode not working (Sentinel)**
- Initialize Hive box before use
- Implement sync retry logic

---

## Next Steps

1. Review `data-model.md` for database schema
2. Check `contracts/README.md` for API endpoints
3. Implement Edge Functions in `supabase/functions/`
4. Set up CI/CD in `.github/workflows/`
5. Run `/speckit.tasks` to generate implementation tasks
