/**
 * Authentication BLoC for Sentinel app
 * Manages authentication state and offline sessions
 */

import 'package:bloc/bloc.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:sentinel/core/supabase/supabase_client.dart';
import 'auth_event.dart';
import 'auth_state.dart' as app_auth;

class AuthBloc extends Bloc<AuthEvent, app_auth.AuthState> {
  final SupabaseClient _supabase;

  AuthBloc({SupabaseClient? supabase})
      : _supabase = supabase ?? Supabase.instance.client,
        super(const app_auth.AuthInitial()) {
    on<AuthCheckRequested>(_onAuthCheckRequested);
    on<AuthSignInRequested>(_onAuthSignInRequested);
    on<AuthSignOutRequested>(_onAuthSignOutRequested);
    on<AuthSessionRefreshRequested>(_onAuthSessionRefreshRequested);

    // Check initial auth state
    add(const AuthCheckRequested());
  }

  Future<void> _onAuthCheckRequested(
    AuthCheckRequested event,
    Emitter<app_auth.AuthState> emit,
  ) async {
    emit(const app_auth.AuthLoading());

    try {
      final session = _supabase.auth.currentSession;
      final user = _supabase.auth.currentUser;

      if (session != null && user != null) {
        // Fetch user profile with role and gate assignment
        final profileData = await _fetchUserProfile(user.id);

        if (profileData == null) {
          emit(const app_auth.AuthError('User profile not found'));
          return;
        }

        emit(app_auth.AuthAuthenticated(
          user: user,
          session: session,
          userRole: profileData['role'] as String,
          gateAssignment: profileData['gate_assignment'] as String?,
        ));
      } else {
        emit(const app_auth.AuthUnauthenticated());
      }
    } catch (e) {
      emit(app_auth.AuthError(e.toString()));
    }
  }

  Future<void> _onAuthSignInRequested(
    AuthSignInRequested event,
    Emitter<app_auth.AuthState> emit,
  ) async {
    emit(const app_auth.AuthLoading());

    try {
      final response = await _supabase.auth.signInWithPassword(
        email: event.email,
        password: event.password,
      );

      if (response.session != null && response.user != null) {
        // Fetch user profile with role and gate assignment
        final profileData = await _fetchUserProfile(response.user!.id);

        if (profileData == null) {
          await _supabase.auth.signOut();
          emit(const app_auth.AuthError('User profile not found'));
          return;
        }

        final userRole = profileData['role'] as String;

        // Validate that user is a security officer
        if (!['security_head', 'security_officer'].contains(userRole)) {
          await _supabase.auth.signOut();
          emit(const app_auth.AuthError('Access denied. This app is only for security officers.'));
          return;
        }

        emit(app_auth.AuthAuthenticated(
          user: response.user!,
          session: response.session!,
          userRole: userRole,
          gateAssignment: profileData['gate_assignment'] as String?,
        ));
      } else {
        emit(const app_auth.AuthError('Invalid credentials'));
      }
    } catch (e) {
      emit(app_auth.AuthError(e.toString()));
    }
  }

  Future<void> _onAuthSignOutRequested(
    AuthSignOutRequested event,
    Emitter<app_auth.AuthState> emit,
  ) async {
    // Only sign out if we're currently authenticated
    if (state is app_auth.AuthAuthenticated) {
      try {
        await _supabase.auth.signOut();
        emit(const app_auth.AuthUnauthenticated());
      } catch (e) {
        emit(app_auth.AuthError(e.toString()));
      }
    } else {
      // Already signed out, just emit unauthenticated state
      emit(const app_auth.AuthUnauthenticated());
    }
  }

  Future<void> _onAuthSessionRefreshRequested(
    AuthSessionRefreshRequested event,
    Emitter<app_auth.AuthState> emit,
  ) async {
    try {
      final session = _supabase.auth.currentSession;
      final user = _supabase.auth.currentUser;

      if (session != null && user != null) {
        // Fetch user profile with role and gate assignment
        final profileData = await _fetchUserProfile(user.id);

        if (profileData == null) {
          emit(const app_auth.AuthError('User profile not found'));
          return;
        }

        emit(app_auth.AuthAuthenticated(
          user: user,
          session: session,
          userRole: profileData['role'] as String,
          gateAssignment: profileData['gate_assignment'] as String?,
        ));
      } else {
        emit(const app_auth.AuthUnauthenticated());
      }
    } catch (e) {
      emit(app_auth.AuthError(e.toString()));
    }
  }

  /// Fetch user profile from user_profiles table
  Future<Map<String, dynamic>?> _fetchUserProfile(String userId) async {
    try {
      final response = await _supabase
          .from('user_profiles')
          .select('role, position')
          .eq('id', userId)
          .single();

      // Map position to gate_assignment for backwards compatibility
      return {
        'role': response['role'],
        'gate_assignment': _extractGateFromPosition(response['position'] as String?),
      };
    } catch (e) {
      print('Error fetching user profile: $e');
      return null;
    }
  }

  /// Extract gate assignment from position string
  /// e.g., "Security Officer - Gate A" -> "A"
  String? _extractGateFromPosition(String? position) {
    if (position == null) return null;

    // Check for gate patterns in position
    final gateMatch = RegExp(r'Gate\s+([A-Za-z0-9]+)', caseSensitive: false)
        .firstMatch(position);

    if (gateMatch != null && gateMatch.groupCount > 0) {
      return gateMatch.group(1);
    }

    return null;
  }
}
