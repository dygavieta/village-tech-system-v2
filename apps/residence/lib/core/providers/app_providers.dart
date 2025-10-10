/**
 * Core app providers for Residence app
 * Central provider exports for global state management
 */

// Export Supabase providers
export 'package:residence/core/supabase/supabase_client.dart';

// Export Auth providers
export 'package:residence/features/auth/providers/auth_provider.dart';

// Export Routing providers
// Note: Router is configured in app_router.dart and consumed in main.dart
