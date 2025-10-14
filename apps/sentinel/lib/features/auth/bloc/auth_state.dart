/**
 * Authentication states for Sentinel app
 */

import 'package:equatable/equatable.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthAuthenticated extends AuthState {
  final User user;
  final Session session;
  final String userRole;
  final String? gateAssignment;

  const AuthAuthenticated({
    required this.user,
    required this.session,
    required this.userRole,
    this.gateAssignment,
  });

  @override
  List<Object?> get props => [user, session, userRole, gateAssignment];
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class AuthError extends AuthState {
  final String message;

  const AuthError(this.message);

  @override
  List<Object?> get props => [message];
}
