# Village Tech System V2

Multi-tenant HOA management platform with Platform, Admin, Residence, and Sentinel applications.

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

## Documentation

- [Quickstart Guide](./specs/001-residential-community-management/quickstart.md)
- [Implementation Plan](./specs/001-residential-community-management/plan.md)
- [Data Model](./specs/001-residential-community-management/data-model.md)
- [API Contracts](./specs/001-residential-community-management/contracts/README.md)
- [Research](./specs/001-residential-community-management/research.md)

## License

UNLICENSED - Proprietary software for 98Labs
