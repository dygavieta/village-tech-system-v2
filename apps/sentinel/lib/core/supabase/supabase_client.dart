/**
 * Supabase client singleton for Sentinel app
 * Provides access to Supabase services with offline support
 */

import 'package:supabase_flutter/supabase_flutter.dart';

/// Global Supabase client instance
SupabaseClient get supabase => Supabase.instance.client;

/// Auth helper extensions
extension SupabaseAuthExtension on GoTrueClient {
  /// Get tenant_id from current JWT
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

  /// Get user role from current JWT
  String? get userRole {
    final jwt = currentSession?.accessToken;
    if (jwt == null) return null;

    try {
      // Decode JWT and extract role claim
      final parts = jwt.split('.');
      if (parts.length != 3) return null;

      final payload = parts[1];
      // Implement JWT decoding here
      return null; // Placeholder
    } catch (e) {
      return null;
    }
  }

  /// Check if user is security officer
  bool get isSecurityOfficer {
    final role = userRole;
    return role == 'security_head' || role == 'security_officer';
  }
}
