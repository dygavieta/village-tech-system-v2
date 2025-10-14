/**
 * Authentication events for Sentinel app
 */

import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class AuthCheckRequested extends AuthEvent {
  const AuthCheckRequested();
}

class AuthSignInRequested extends AuthEvent {
  final String email;
  final String password;

  const AuthSignInRequested({
    required this.email,
    required this.password,
  });

  @override
  List<Object?> get props => [email, password];
}

// Alias for compatibility with login_screen.dart
class LoginRequested extends AuthSignInRequested {
  const LoginRequested({
    required super.email,
    required super.password,
  });
}

class AuthSignOutRequested extends AuthEvent {
  const AuthSignOutRequested();
}

// Alias for compatibility with login_screen.dart
class LogoutRequested extends AuthSignOutRequested {
  const LogoutRequested();
}

class AuthSessionRefreshRequested extends AuthEvent {
  const AuthSessionRefreshRequested();
}
