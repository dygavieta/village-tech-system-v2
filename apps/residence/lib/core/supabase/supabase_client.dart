/**
 * Supabase client singleton for Residence app
 * Provides access to Supabase services across the app
 */

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Supabase client provider
/// Access via ref.watch(supabaseClientProvider)
final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

/// Current user provider
/// Returns null if no user is logged in
final currentUserProvider = StreamProvider<User?>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  return supabase.auth.onAuthStateChange.map((data) => data.session?.user);
});

/// Current session provider
final currentSessionProvider = StreamProvider<Session?>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  return supabase.auth.onAuthStateChange.map((data) => data.session);
});

/// Helper to get tenant_id from JWT
extension SupabaseAuthExtension on GoTrueClient {
  String? get tenantId {
    final jwt = currentSession?.accessToken;
    if (jwt == null) return null;

    try {
      // Decode JWT and extract tenant_id claim
      // Note: In production, use proper JWT library
      final parts = jwt.split('.');
      if (parts.length != 3) return null;

      final payload = parts[1];
      // Implement JWT decoding here
      return null; // Placeholder
    } catch (e) {
      return null;
    }
  }
}
